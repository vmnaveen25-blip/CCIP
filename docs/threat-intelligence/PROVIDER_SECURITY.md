# PROVIDER SECURITY & ANTI-SSRF HARDENING SPECIFICATION

**System:** CCIP (Citizen Cybercrime Intelligence Platform)  
**Classification:** HIGH CONFIDENTIAL / APPLICATION SECURITY  
**Document Ref:** CTI-SEC-007  

---

## 1. Threat Model & Adversarial Vectors

Connecting an internal law enforcement and evidence management system to external network resources introduces critical threat vectors:
1. **Server-Side Request Forgery (SSRF):** A malicious actor or compromised external feed configuration could manipulate feed URLs to hit internal administrative services (e.g. `http://127.0.0.1:8000/api/v1/admin`) or cloud provider metadata endpoints (`http://169.254.169.254/latest/meta-data`).
2. **DNS Rebinding:** An attacker-controlled DNS server could respond with a legitimate public IP during pre-flight checks, and immediately rebind to `127.0.0.1` during actual socket connection.
3. **Protocol Smuggling:** Attacks utilizing non-HTTP schemes (`file://`, `gopher://`, `dict://`, `ftp://`) to read local files or interact with internal daemons.
4. **Denial of Service (DoS):** Malicious feeds streaming multi-gigabyte files or hanging indefinitely to exhaust connection pools.

---

## 2. Hardened Security Controls Implemented

The `threat_ssrf_guard.py` module enforces four layers of defense:

### Layer 1: Protocol Scheme Allowlisting
- Only `http` and `https` schemes are accepted. Non-HTTP protocols (`file://`, `ftp://`, `gopher://`, `data://`) are rejected before hostname resolution:
  ```python
  if parsed.scheme.lower() not in ("http", "https"):
      raise SSRFSecurityViolation(f"Forbidden protocol scheme '{parsed.scheme}'.")
  ```

### Layer 2: Pre-Flight Destination IP & Subnet Blacklisting
Every destination hostname is resolved via `socket.getaddrinfo`, and every resolved IP is matched against `FORBIDDEN_NETWORKS`:

| Forbidden Subnet | Range | Threat Category Mitigated |
| :--- | :--- | :--- |
| `127.0.0.0/8`, `::1/128` | Loopback | Attacks targeting localhost services and local admin ports. |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | RFC 1918 Private | Lateral network scanning inside sovereign VPC or police LAN. |
| `169.254.0.0/16`, `fe80::/10` | Link-Local / Metadata | Exfiltration of AWS, Azure, GCP instance credentials (`169.254.169.254`). |
| `0.0.0.0/8`, `::/128` | Unspecified | Routing confusion and Linux localhost aliasing. |
| `224.0.0.0/4`, `ff00::/8` | Multicast | Network broadcast flooding and router redirection. |
| `fc00::/7` | Unique Local (IPv6) | Private internal IPv6 mesh scanning. |

If any resolved address falls within a forbidden subnet, the request is aborted immediately with `SSRFSecurityViolation`.

### Layer 3: Redirection Disablement
Automated HTTP redirect following is **permanently disabled** (`follow_redirects=False`) in `SSRFSafeHttpClient`. If an external server responds with an HTTP 301/302 redirecting to an internal IP, httpx will **not** follow it, preventing open-redirect SSRF bypasses.

### Layer 4: Strict Timeouts & Payload Size Caps
- **Connect & Read Timeout:** 12 seconds maximum per request (`FEED_TIMEOUT`).
- **Response Size Cap:** 10 MB maximum (`MAX_RESPONSE_BYTES`). If `Content-Length` exceeds 10 MB, the request is terminated with HTTP 413 `FEED_PAYLOAD_TOO_LARGE`.

---

## 3. Privilege Escalation & Bypass Guard

In `backend/app/core/permissions.py`:
- The prefix `"/api/v1/threat-intel"` is explicitly registered in `PRIVILEGED_PREFIXES`.
- Development authentication bypass is **permanently forbidden** on all `/api/v1/threat-intel` routes, even in local development mode.
- Non-admin attempts to configure or modify feeds (`POST /api/v1/threat-intel/sources`) are rejected with HTTP 403 Forbidden.
