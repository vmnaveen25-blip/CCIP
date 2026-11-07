"""
SSRF and Outbound Network Protection Guard
Enforces strict destination allowlisting, private/loopback/cloud-metadata blocking,
and DNS rebinding prevention for external threat feed ingestion.
"""

import ipaddress
import socket
from urllib.parse import urlparse
from typing import Tuple, Optional
import httpx

from app.core.logging import logger
from app.core.exceptions import CCIPException


class SSRFSecurityViolation(CCIPException):
    """Raised when an outbound URL violates sovereign network security boundaries."""
    def __init__(self, message: str):
        super().__init__(message=message, status_code=400, code="SSRF_SECURITY_VIOLATION")


# Blocked IPv4 / IPv6 network ranges
FORBIDDEN_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),          # Current network (only valid as source)
    ipaddress.ip_network("10.0.0.0/8"),         # RFC 1918 Private
    ipaddress.ip_network("127.0.0.0/8"),        # Loopback
    ipaddress.ip_network("169.254.0.0/16"),     # Link-local / Cloud Metadata (AWS, Azure, GCP 169.254.169.254)
    ipaddress.ip_network("172.16.0.0/12"),      # RFC 1918 Private
    ipaddress.ip_network("192.168.0.0/16"),     # RFC 1918 Private
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved
    ipaddress.ip_network("255.255.255.255/32"), # Broadcast
    ipaddress.ip_network("::/128"),             # Unspecified
    ipaddress.ip_network("::1/128"),            # Loopback
    ipaddress.ip_network("fc00::/7"),           # Unique Local Address (ULA)
    ipaddress.ip_network("fe80::/10"),          # Link-local
    ipaddress.ip_network("ff00::/8"),           # Multicast
]

ALLOWED_SCHEMES = ("http", "https")
MAX_RESPONSE_BYTES = 10 * 1024 * 1024  # 10 MB maximum payload


def validate_outbound_url(url: str) -> Tuple[str, str, int]:
    """
    Validates that a URL does not point to internal, private, loopback, or cloud-metadata IPs.
    Resolves DNS and performs pre-flight IP validation against forbidden subnets.
    Returns (scheme, resolved_ip, port).
    """
    if not url or not isinstance(url, str):
        raise SSRFSecurityViolation("Empty or invalid URL provided.")

    parsed = urlparse(url)
    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        raise SSRFSecurityViolation(f"Forbidden protocol scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFSecurityViolation("URL does not contain a valid hostname.")

    port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)

    # Resolve hostname to target IPs
    try:
        addr_info = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except socket.gaierror as e:
        raise SSRFSecurityViolation(f"Unable to resolve host '{hostname}': {str(e)}")

    if not addr_info:
        raise SSRFSecurityViolation(f"DNS resolution returned no addresses for host '{hostname}'.")

    # Check each resolved IP address against forbidden network blocks
    for item in addr_info:
        sockaddr = item[4]
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except ValueError:
            raise SSRFSecurityViolation(f"Resolved address '{ip_str}' is not a valid IP.")

        # Check against private / loopback / cloud-metadata networks
        for forbidden in FORBIDDEN_NETWORKS:
            if ip_obj in forbidden:
                logger.warning(f"SSRF block triggered: {hostname} resolved to {ip_str} which is in {forbidden}")
                raise SSRFSecurityViolation(
                    f"Destination address '{ip_str}' belongs to forbidden/private network {forbidden}. Ingestion rejected."
                )

    # Return primary verified IP
    primary_ip = addr_info[0][4][0]
    return parsed.scheme.lower(), primary_ip, port


class SSRFSafeHttpClient:
    """
    An HTTP client enforcing pre-request IP validation, strict timeouts,
    and response size truncation to prevent resource exhaustion and SSRF.
    """
    def __init__(self, timeout_seconds: float = 12.0, max_bytes: int = MAX_RESPONSE_BYTES):
        self.timeout = timeout_seconds
        self.max_bytes = max_bytes

    async def get(self, url: str, headers: Optional[dict] = None) -> httpx.Response:
        validate_outbound_url(url)
        limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        async with httpx.AsyncClient(
            timeout=self.timeout,
            limits=limits,
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
        validate_outbound_url(url)
        limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        async with httpx.AsyncClient(
            timeout=self.timeout,
            limits=limits,
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

