from urllib.parse import urlparse
import ipaddress
from datetime import datetime, timezone

try:
    import whois
except ImportError:
    whois = None

try:
    import requests
except ImportError:
    requests = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

def get_date(date_value):
    if isinstance(date_value, list):
        return date_value[0]
    return date_value


KNOWN_TRUSTED_DOMAINS = {
    "google.com", "youtube.com", "facebook.com", "github.com", "microsoft.com",
    "apple.com", "amazon.com", "wikipedia.org", "twitter.com", "x.com",
    "linkedin.com", "cybercrime.gov.in", "onlinesbi.sbi", "sbi.co.in",
    "hdfcbank.com", "icicibank.com", "axisbank.com", "pnbindia.in", "rbi.org.in",
    "gov.in", "nic.in"
}

def extract_features(url):

    features = {}

    # Add http:// if missing
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    parsed_url = urlparse(url)
    hostname = parsed_url.hostname
    if hostname is None:
        hostname = ""

    hostname_lower = hostname.lower()
    clean_host = hostname_lower.removeprefix("www.")
    is_known_trusted = (clean_host in KNOWN_TRUSTED_DOMAINS) or any(
        clean_host.endswith("." + d) for d in KNOWN_TRUSTED_DOMAINS
    )

    # -------------------------------------------------------------
    # Sovereign Offline Mode / SSRF Prevention
    # Enforces zero outbound HTTP/WHOIS calls to prevent SSRF and network timeouts.
    # Deterministic safe fallbacks are applied for all web/WHOIS dependent features.
    # -------------------------------------------------------------
    response = None
    soup = None
    domain_info = None

    # -----------------------------------
    # 1. having_IP_Address
    # -----------------------------------
    try:
        ipaddress.ip_address(hostname)
        features["having_IP_Address"] = 1
    except Exception:
        features["having_IP_Address"] = -1

    # -----------------------------------
    # 2. URLURL_Length
    # -----------------------------------
    length = len(url)

    if length < 54:
        features["URLURL_Length"] = -1
    elif length <= 75:
        features["URLURL_Length"] = 0
    else:
        features["URLURL_Length"] = 1

    # -----------------------------------
    # 3. Shortining_Service
    # -----------------------------------
    shorteners = [
        "bit.ly", "tinyurl.com", "goo.gl",
        "t.co", "ow.ly", "is.gd",
        "buff.ly", "cutt.ly", "rebrand.ly"
    ]

    if any(service in hostname_lower for service in shorteners):
        features["Shortining_Service"] = 1
    else:
        features["Shortining_Service"] = -1

    # -----------------------------------
    # 4. having_At_Symbol
    # -----------------------------------
    features["having_At_Symbol"] = 1 if "@" in url else -1

    # -----------------------------------
    # 5. double_slash_redirecting
    # -----------------------------------
    if url.rfind("//") > 7:
        features["double_slash_redirecting"] = 1
    else:
        features["double_slash_redirecting"] = -1

    # -----------------------------------
    # 6. Prefix_Suffix
    # -----------------------------------
    features["Prefix_Suffix"] = 1 if "-" in hostname else -1

    # -----------------------------------
    # 7. having_Sub_Domain
    # -----------------------------------
    dots = clean_host.count(".")

    if dots <= 1:
        features["having_Sub_Domain"] = -1
    elif dots == 2:
        features["having_Sub_Domain"] = 0
    else:
        features["having_Sub_Domain"] = 1

    # -----------------------------------
    # 8. SSLfinal_State (In UCI: -1 = Legitimate HTTPS, 1 = Insecure HTTP/Suspicious)
    # -----------------------------------
    features["SSLfinal_State"] = -1 if parsed_url.scheme == "https" else 1

    # -----------------------------------
    # 9. Domain_registeration_length
    # -----------------------------------
    features["Domain_registeration_length"] = -1 if is_known_trusted else (1 if "@" in url else 0)

    # -----------------------------------
    # 10. age_of_domain
    # -----------------------------------
    features["age_of_domain"] = -1 if is_known_trusted else (1 if "@" in url else 0)

    # -----------------------------------
    # 11. DNSRecord
    # -----------------------------------
    features["DNSRecord"] = -1 if (is_known_trusted or len(clean_host) > 3) else 1

    # -----------------------------------
    # 12. Favicon
    # -----------------------------------
    features["Favicon"] = -1 if is_known_trusted else 0

    # -----------------------------------
    # 13. port
    # -----------------------------------
    try:
        port = parsed_url.port
        if port is None or port in [80, 443]:
            features["port"] = -1
        else:
            features["port"] = 1
    except Exception:
        features["port"] = -1

    # -----------------------------------
    # 14. HTTPS_token
    # -----------------------------------
    if "https" in clean_host:
        features["HTTPS_token"] = 1
    else:
        features["HTTPS_token"] = -1

    # -----------------------------------
    # 15. Request_URL
    # -----------------------------------
    features["Request_URL"] = -1 if is_known_trusted else (1 if "@" in url else 0)

    # -----------------------------------
    # 16. URL_of_Anchor
    # -----------------------------------
    features["URL_of_Anchor"] = -1 if is_known_trusted else (1 if ("@" in url or "-" in hostname or dots > 2) else 0)

    # -----------------------------------
    # 17. Links_in_tags
    # -----------------------------------
    features["Links_in_tags"] = -1 if is_known_trusted else (1 if "@" in url else 0)

    # -----------------------------------
    # 18. SFH
    # -----------------------------------
    features["SFH"] = -1 if is_known_trusted else (1 if "@" in url else 0)

    # -----------------------------------
    # 19. Submitting_to_email
    # -----------------------------------
    features["Submitting_to_email"] = -1

    # -----------------------------------
    # 20. Abnormal_URL
    # -----------------------------------
    if not hostname or hostname.startswith(".") or "@" in url or ".." in hostname:
        features["Abnormal_URL"] = 1
    elif not is_known_trusted and ("-" in hostname or dots > 2):
        features["Abnormal_URL"] = 1
    else:
        features["Abnormal_URL"] = -1

    # -----------------------------------
    # 21. Redirect
    # -----------------------------------
    features["Redirect"] = -1

    # -----------------------------------
    # 22. on_mouseover
    # -----------------------------------
    features["on_mouseover"] = -1

    # -----------------------------------
    # 23. RightClick
    # -----------------------------------
    features["RightClick"] = -1

    # -----------------------------------
    # 24. popUpWidnow
    # -----------------------------------
    features["popUpWidnow"] = -1

    # -----------------------------------
    # 25. Iframe
    # -----------------------------------
    features["Iframe"] = -1

    # -----------------------------------
    # 26. web_traffic
    # -----------------------------------
    features["web_traffic"] = -1 if is_known_trusted else 0

    # -----------------------------------
    # 27. Page_Rank
    # -----------------------------------
    features["Page_Rank"] = -1 if is_known_trusted else 0

    # -----------------------------------
    # 28. Google_Index
    # -----------------------------------
    features["Google_Index"] = -1 if is_known_trusted else 0

    # -----------------------------------
    # 29. Links_pointing_to_page
    # -----------------------------------
    features["Links_pointing_to_page"] = -1 if is_known_trusted else 0

    # -----------------------------------
    # 30. Statistical_report
    # -----------------------------------
    suspicious_domains = [
        "at.ua", "usa.cc", "baltazarpresentes.com.br", "ow.ly", "bit.ly", "tinyurl.com"
    ]
    suspicious_tlds = [
        ".xyz", ".top", ".buzz", ".club", ".work", ".tk", ".ml", ".ga",
        ".cf", ".gq", ".cam", ".sbs", ".click", ".link", ".zip", ".country",
        ".stream", ".download", ".bid", ".racing", ".win", ".party", ".trade"
    ]

    if (
        hostname_lower in suspicious_domains
        or any(hostname_lower.endswith(tld) for tld in suspicious_tlds)
        or "@" in url
    ):
        features["Statistical_report"] = 1
    else:
        features["Statistical_report"] = -1

    return features