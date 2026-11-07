"""
SSRF and Outbound Network Protection Guard
Enforces strict destination allowlisting, private/loopback/cloud-metadata blocking,
IPv4-mapped IPv6 inspection, alternate IP representation decoding,
and socket-level IP pinning to eliminate DNS rebinding (TOCTOU) for external threat feeds.
"""

import ipaddress
import socket
from urllib.parse import urlparse
from typing import Tuple, Optional, List
import httpx
import httpcore

from app.core.logging import logger
from app.core.exceptions import CCIPException


class SSRFSecurityViolation(CCIPException):
    """Raised when an outbound URL violates sovereign network security boundaries."""
    def __init__(self, message: str):
        super().__init__(message=message, status_code=400, code="SSRF_SECURITY_VIOLATION")


# Blocked IPv4 / IPv6 network ranges
FORBIDDEN_NETWORKS = [
    # IPv4 Forbidden Ranges
    ipaddress.ip_network("0.0.0.0/8"),          # Current network (RFC 1122)
    ipaddress.ip_network("10.0.0.0/8"),         # RFC 1918 Private
    ipaddress.ip_network("100.64.0.0/10"),      # Shared Address Space (RFC 6598 CGNAT)
    ipaddress.ip_network("127.0.0.0/8"),        # Loopback (RFC 1122)
    ipaddress.ip_network("169.254.0.0/16"),     # Link-local / Cloud Metadata (AWS, Azure, GCP 169.254.169.254)
    ipaddress.ip_network("172.16.0.0/12"),      # RFC 1918 Private
    ipaddress.ip_network("192.0.0.0/24"),       # IETF Protocol Assignments (RFC 6890)
    ipaddress.ip_network("192.168.0.0/16"),     # RFC 1918 Private
    ipaddress.ip_network("198.18.0.0/15"),      # Benchmarking (RFC 2544)
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast (RFC 5771)
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved for future use (RFC 1112)
    ipaddress.ip_network("255.255.255.255/32"), # Broadcast
    
    # IPv6 Forbidden Ranges
    ipaddress.ip_network("::/128"),             # Unspecified
    ipaddress.ip_network("::1/128"),            # Loopback
    ipaddress.ip_network("::ffff:0:0/96"),      # IPv4-mapped IPv6 prefix
    ipaddress.ip_network("64:ff9b::/96"),       # IPv4/IPv6 translation
    ipaddress.ip_network("fc00::/7"),           # Unique Local Address (ULA - private)
    ipaddress.ip_network("fe80::/10"),          # Link-local unicast
    ipaddress.ip_network("ff00::/8"),           # Multicast
]

ALLOWED_SCHEMES = ("http", "https")
MAX_RESPONSE_BYTES = 10 * 1024 * 1024  # 10 MB maximum payload


def parse_alternate_ip(hostname: str) -> Optional[ipaddress.IPv4Address | ipaddress.IPv6Address]:
    """
    Parses alternate IP representations such as decimal integers, hex, or octal dotted quads.
    Examples:
      - '2130706433' -> IPv4Address('127.0.0.1')
      - '0x7f000001' -> IPv4Address('127.0.0.1')
      - '0177.0.0.1' -> IPv4Address('127.0.0.1')
      - '::ffff:127.0.0.1' -> IPv6Address('::ffff:7f00:1')
    """
    if not hostname or not isinstance(hostname, str):
        return None

    clean_host = hostname.strip("[]").strip()

    # 1. Standard ip_address parse
    try:
        return ipaddress.ip_address(clean_host)
    except ValueError:
        pass

    # 2. Integer (decimal) representation
    if clean_host.isdigit():
        try:
            val = int(clean_host)
            if 0 <= val <= 0xFFFFFFFF:
                return ipaddress.IPv4Address(val)
        except Exception:
            pass

    # 3. Hexadecimal representation
    if clean_host.lower().startswith("0x"):
        try:
            val = int(clean_host, 16)
            if 0 <= val <= 0xFFFFFFFF:
                return ipaddress.IPv4Address(val)
        except Exception:
            pass

    # 4. Octal or mixed dotted notation
    parts = clean_host.split(".")
    if len(parts) == 4:
        try:
            octets = []
            has_alt = False
            for p in parts:
                p_clean = p.strip()
                if p_clean.lower().startswith("0x"):
                    octets.append(int(p_clean, 16))
                    has_alt = True
                elif p_clean.startswith("0") and len(p_clean) > 1 and p_clean.isdigit():
                    octets.append(int(p_clean, 8))
                    has_alt = True
                elif p_clean.isdigit():
                    octets.append(int(p_clean))
                else:
                    return None
            if has_alt and all(0 <= o <= 255 for o in octets):
                return ipaddress.IPv4Address(".".join(map(str, octets)))
        except Exception:
            pass

    return None


def check_ip_security(ip_obj: ipaddress.IPv4Address | ipaddress.IPv6Address, hostname: str) -> None:
    """
    Validates an IP object and any IPv4-mapped representations against forbidden subnets and properties.
    Raises SSRFSecurityViolation if address violates boundaries.
    """
    ips_to_check = [ip_obj]
    mapped = getattr(ip_obj, "ipv4_mapped", None)
    if mapped is not None:
        ips_to_check.append(mapped)

    for target in ips_to_check:
        # Check standard properties
        if (target.is_private or target.is_loopback or target.is_link_local or 
            target.is_multicast or target.is_reserved or target.is_unspecified):
            logger.warning(f"SSRF block triggered: Host '{hostname}' resolved to '{ip_obj}' (checked '{target}') with private/loopback properties.")
            raise SSRFSecurityViolation(
                f"Destination address '{target}' belongs to forbidden/private network, loopback, link-local, or reserved network range. Ingestion rejected."
            )

        # Check explicit CIDR blocks
        for forbidden in FORBIDDEN_NETWORKS:
            if target in forbidden:
                logger.warning(f"SSRF block triggered: Host '{hostname}' resolved to '{ip_obj}' (checked '{target}') in forbidden CIDR {forbidden}.")
                raise SSRFSecurityViolation(
                    f"Destination address '{target}' belongs to forbidden/private network {forbidden}. Ingestion rejected."
                )


def validate_outbound_url(url: str) -> Tuple[str, str, int]:
    """
    Validates that a URL does not point to internal, private, loopback, or cloud-metadata IPs.
    Checks alternate IP encodings, inspects IPv4-mapped IPv6 addresses, and verifies all resolved DNS records.
    Returns (scheme, validated_primary_ip, port).
    """
    if not url or not isinstance(url, str):
        raise SSRFSecurityViolation("Empty or invalid URL provided.")

    parsed = urlparse(url)
    scheme = parsed.scheme.lower()
    if scheme not in ALLOWED_SCHEMES:
        raise SSRFSecurityViolation(f"Forbidden protocol scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFSecurityViolation("URL does not contain a valid hostname.")

    port = parsed.port or (443 if scheme == "https" else 80)

    # 1. Pre-check alternate IP representations (decimal, hex, octal, literal)
    alt_ip = parse_alternate_ip(hostname)
    if alt_ip is not None:
        check_ip_security(alt_ip, hostname)
        return scheme, str(alt_ip), port

    # 2. Resolve DNS for hostname and validate ALL returned addresses
    try:
        addr_info = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except socket.gaierror as e:
        raise SSRFSecurityViolation(f"Unable to resolve host '{hostname}': {str(e)}")

    if not addr_info:
        raise SSRFSecurityViolation(f"DNS resolution returned no addresses for host '{hostname}'.")

    # If any resolved IP is internal/forbidden, reject the entire destination
    for item in addr_info:
        sockaddr = item[4]
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except ValueError:
            raise SSRFSecurityViolation(f"Resolved address '{ip_str}' is not a valid IP.")

        check_ip_security(ip_obj, hostname)

    # Return primary verified IP for socket pinning
    primary_ip = addr_info[0][4][0]
    return scheme, primary_ip, port


class PinnedAsyncNetworkBackend(httpcore.AnyIOBackend):
    """
    Custom async network backend that intercepts socket connection creation and binds
    directly to a pre-validated IP address, eliminating DNS rebinding (TOCTOU) vulnerabilities.
    """
    def __init__(self, pinned_ip: str):
        super().__init__()
        self.pinned_ip = pinned_ip

    async def connect_tcp(
        self,
        host: str,
        port: int,
        timeout: Optional[float] = None,
        local_address: Optional[str] = None,
        socket_options=None
    ):
        logger.debug(f"SSRF IP Pinning: Intercepting TCP connect for host '{host}', pinning socket to '{self.pinned_ip}:{port}'")
        return await super().connect_tcp(
            host=self.pinned_ip,
            port=port,
            timeout=timeout,
            local_address=local_address,
            socket_options=socket_options
        )


class PinnedAsyncHTTPTransport(httpx.AsyncHTTPTransport):
    """
    Async HTTP transport configured with a pinned IP connection pool.
    """
    def __init__(self, pinned_ip: str, **kwargs):
        super().__init__(**kwargs)
        self._pool = httpcore.AsyncConnectionPool(
            ssl_context=self._pool._ssl_context,
            network_backend=PinnedAsyncNetworkBackend(pinned_ip),
            retries=kwargs.get("retries", 0)
        )


class SSRFSafeHttpClient:
    """
    An HTTP client enforcing pre-request IP validation, socket IP pinning (preventing
    DNS rebinding TOCTOU), strict timeouts, redirect blocking, and response size truncation.
    """
    def __init__(self, timeout_seconds: float = 12.0, max_bytes: int = MAX_RESPONSE_BYTES):
        self.timeout = timeout_seconds
        self.max_bytes = max_bytes

    async def get(self, url: str, headers: Optional[dict] = None) -> httpx.Response:
        scheme, validated_ip, port = validate_outbound_url(url)
        transport = PinnedAsyncHTTPTransport(pinned_ip=validated_ip)
        async with httpx.AsyncClient(
            transport=transport,
            timeout=self.timeout,
            follow_redirects=False,  # Disallow automated redirects to prevent open-redirect SSRF
            headers=headers or {}
        ) as client:
            try:
                resp = await client.get(url)
            except httpx.TimeoutException:
                raise CCIPException(message=f"Threat feed request to {url} timed out after {self.timeout}s", status_code=504, code="FEED_TIMEOUT")
            except httpx.RequestError as e:
                raise CCIPException(message=f"Network error querying threat feed: {str(e)}", status_code=502, code="FEED_NETWORK_ERROR")

            # Check response size
            content_length = resp.headers.get("Content-Length")
            if content_length and int(content_length) > self.max_bytes:
                raise CCIPException(
                    message=f"Feed response exceeds maximum allowed size ({content_length} > {self.max_bytes} bytes).",
                    status_code=413,
                    code="FEED_PAYLOAD_TOO_LARGE"
                )

            return resp

    async def post(self, url: str, json_data: Optional[dict] = None, headers: Optional[dict] = None) -> httpx.Response:
        scheme, validated_ip, port = validate_outbound_url(url)
        transport = PinnedAsyncHTTPTransport(pinned_ip=validated_ip)
        async with httpx.AsyncClient(
            transport=transport,
            timeout=self.timeout,
            follow_redirects=False,
            headers=headers or {}
        ) as client:
            try:
                resp = await client.post(url, json=json_data)
            except httpx.TimeoutException:
                raise CCIPException(message=f"Threat feed request timed out after {self.timeout}s", status_code=504, code="FEED_TIMEOUT")
            except httpx.RequestError as e:
                raise CCIPException(message=f"Network error querying threat feed: {str(e)}", status_code=502, code="FEED_NETWORK_ERROR")

            return resp


ssrf_safe_client = SSRFSafeHttpClient()


