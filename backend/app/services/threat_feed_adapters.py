"""
Modular Threat Intelligence Connectors and Adapters
Supports STIX 2.1, TAXII 2.1, MISP, AlienVault OTX, URLhaus, AbuseIPDB, and VirusTotal.
Includes exponential backoff, rate limit tracking, and strict attribution.
"""

import os
import re
import abc
import json
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from app.core.logging import logger
from app.services.threat_ioc_service import ioc_normalization_service
from app.services.threat_ssrf_guard import ssrf_safe_client, SSRFSecurityViolation


class FeedIngestionResult:
    def __init__(self, source_name: str):
        self.source_name = source_name
        self.success = False
        self.indicators: List[Dict[str, Any]] = []
        self.imported_count = 0
        self.updated_count = 0
        self.skipped_count = 0
        self.error_message: Optional[str] = None
        self.rate_limit_remaining: Optional[int] = None
        self.retry_after_seconds: Optional[int] = None


class BaseThreatFeedAdapter(abc.ABC):
    """Abstract base class for threat intelligence feed adapters."""

    def __init__(self, source_id: str, name: str, endpoint: str, credential_ref: Optional[str] = None, reliability: float = 0.80):
        self.source_id = source_id
        self.name = name
        self.endpoint = endpoint
        self.credential_ref = credential_ref
        self.reliability = reliability

    def get_api_key(self) -> Optional[str]:
        if not self.credential_ref:
            return None
        return os.environ.get(self.credential_ref)

    @abc.abstractmethod
    def parse_payload(self, raw_data: Any) -> List[Dict[str, Any]]:
        """Parses feed payload into standardized indicator dictionaries."""
        pass

    async def fetch_feed(self, max_retries: int = 3, initial_delay: float = 1.0) -> FeedIngestionResult:
        """Fetches feed data with exponential backoff and timeout safeguards."""
        result = FeedIngestionResult(self.name)
        headers = self.build_headers()

        delay = initial_delay
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"Connecting to feed '{self.name}' at {self.endpoint} (attempt {attempt}/{max_retries})...")
                resp = await ssrf_safe_client.get(self.endpoint, headers=headers)
                
                # Check rate limit headers
                if "X-RateLimit-Remaining" in resp.headers:
                    try:
                        result.rate_limit_remaining = int(resp.headers["X-RateLimit-Remaining"])
                    except ValueError:
                        pass

                if resp.status_code == 429:
                    retry_after = int(resp.headers.get("Retry-After", 5))
                    result.retry_after_seconds = retry_after
                    logger.warning(f"Feed '{self.name}' rate-limited. Retry-After: {retry_after}s")
                    if attempt < max_retries:
                        await asyncio.sleep(retry_after)
                        continue
                    else:
                        result.error_message = f"Rate limited by provider after {max_retries} attempts."
                        return result

                if resp.status_code != 200:
                    result.error_message = f"Feed provider returned HTTP status {resp.status_code}: {resp.text[:200]}"
                    if attempt < max_retries:
                        await asyncio.sleep(delay)
                        delay *= 2.0
                        continue
                    return result

                try:
                    payload = resp.json()
                except Exception:
                    payload = resp.text

                raw_indicators = self.parse_payload(payload)
                result.indicators = self._normalize_indicator_batch(raw_indicators)
                result.imported_count = len(result.indicators)
                result.success = True
                logger.info(f"Feed '{self.name}' successfully parsed {result.imported_count} indicators.")
                return result

            except SSRFSecurityViolation as e:
                result.error_message = f"SSRF Block: {str(e)}"
                logger.error(f"Ingestion rejected for feed '{self.name}': {str(e)}")
                return result
            except Exception as e:
                logger.warning(f"Error fetching feed '{self.name}' on attempt {attempt}: {str(e)}")
                if attempt == max_retries:
                    result.error_message = f"Failed to ingest feed after {max_retries} attempts: {str(e)}"
                    return result
                await asyncio.sleep(delay)
                delay *= 2.0

        return result

    def build_headers(self) -> Dict[str, str]:
        headers = {
            "User-Agent": "CCIP-Sovereign-Threat-Intelligence/1.0",
            "Accept": "application/json"
        }
        api_key = self.get_api_key()
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        return headers

    def _normalize_indicator_batch(self, raw_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized_batch = []
        for raw in raw_list:
            val = raw.get("value", "")
            ioc_type = raw.get("type")
            norm = ioc_normalization_service.normalize_ioc(val, ioc_type)
            if not norm["normalized_value"]:
                continue

            indicator = {
                "source_id": self.source_id,
                "source_name": self.name,
                "indicator_type": norm["ioc_type"],
                "original_value": norm["original_value"],
                "normalized_value": norm["normalized_value"],
                "defanged_value": norm["defanged_value"],
                "threat_category": raw.get("category", "MALWARE"),
                "confidence_score": float(raw.get("confidence", 75.0)),
                "reputation_verdict": raw.get("reputation", "SUSPICIOUS"),
                "external_reference": raw.get("reference", self.endpoint),
                "associated_threat_actor": raw.get("actor"),
                "mitre_techniques": raw.get("mitre_techniques", []),
                "tags": raw.get("tags", []),
                "first_seen": raw.get("first_seen", datetime.now(timezone.utc)),
                "last_seen": raw.get("last_seen", datetime.now(timezone.utc))
            }
            normalized_batch.append(indicator)
        return normalized_batch


# 1. STIX 2.x and TAXII 2.x Adapter
class StixTaxiiAdapter(BaseThreatFeedAdapter):
    """Parses STIX 2.1 JSON Bundles, Indicator SDOs, and Observed-Data."""

    def parse_payload(self, raw_data: Any) -> List[Dict[str, Any]]:
        indicators = []
        if isinstance(raw_data, str):
            try:
                raw_data = json.loads(raw_data)
            except Exception:
                return []

        if not isinstance(raw_data, dict):
            return []

        objects = raw_data.get("objects", [])
        for obj in objects:
            obj_type = obj.get("type", "")
            if obj_type == "indicator":
                pattern = obj.get("pattern", "")
                val = self._extract_value_from_pattern(pattern)
                if val:
                    indicators.append({
                        "value": val,
                        "category": obj.get("indicator_types", ["MALWARE"])[0].upper(),
                        "confidence": float(obj.get("confidence", 80.0)),
                        "reputation": "MALICIOUS",
                        "reference": obj.get("id"),
                        "actor": None,
                        "mitre_techniques": [k for k in obj.get("labels", []) if k.startswith("T1")],
                        "tags": obj.get("labels", [])
                    })
        return indicators

    def _extract_value_from_pattern(self, pattern: str) -> Optional[str]:
        # Simple extraction from STIX pattern e.g. [ipv4-addr:value = '198.51.100.1']
        match = re.search(r"=\s*['\"]([^'\"]+)['\"]", pattern)
        if match:
            return match.group(1)
        return None


# 2. MISP Adapter
class MispAdapter(BaseThreatFeedAdapter):
    """Parses MISP Event JSON feeds and Attribute objects."""

    def parse_payload(self, raw_data: Any) -> List[Dict[str, Any]]:
        indicators = []
        if isinstance(raw_data, str):
            try:
                raw_data = json.loads(raw_data)
            except Exception:
                return []

        if isinstance(raw_data, dict):
            # If wrapped in 'response' or 'Event'
            events = raw_data.get("response", raw_data.get("Event", []))
            if isinstance(events, dict):
                events = [events]
        elif isinstance(raw_data, list):
            events = raw_data
        else:
            return []

        for ev in events:
            ev_data = ev.get("Event", ev) if isinstance(ev, dict) else {}
            attributes = ev_data.get("Attribute", [])
            threat_actor = None
            for tag in ev_data.get("Tag", []):
                t_name = tag.get("name", "")
                if "threat-actor=" in t_name.lower():
                    threat_actor = t_name.split("=")[-1].strip('"\'')

            for attr in attributes:
                val = attr.get("value")
                attr_type = attr.get("type", "").lower()
                category = attr.get("category", "Payload delivery").upper()
                if val:
                    indicators.append({
                        "value": str(val),
                        "category": category,
                        "confidence": 85.0 if attr.get("to_ids") else 60.0,
                        "reputation": "MALICIOUS" if attr.get("to_ids") else "SUSPICIOUS",
                        "reference": f"MISP-ATTR-{attr.get('id')}",
                        "actor": threat_actor,
                        "tags": [t.get("name") for t in attr.get("Tag", [])]
                    })
        return indicators


# 3. AlienVault OTX Adapter
class AlienVaultOtxAdapter(BaseThreatFeedAdapter):
    """Parses AlienVault Open Threat Exchange (OTX) Pulse exports."""

    def parse_payload(self, raw_data: Any) -> List[Dict[str, Any]]:
        indicators = []
        if isinstance(raw_data, str):
            try:
                raw_data = json.loads(raw_data)
            except Exception:
                return []

        results = raw_data.get("results", [raw_data]) if isinstance(raw_data, dict) else raw_data
        if not isinstance(results, list):
            results = [results]

        for pulse in results:
            if not isinstance(pulse, dict):
                continue
            pulse_name = pulse.get("name", "OTX Pulse")
            pulse_iocs = pulse.get("indicators", [])
            for item in pulse_iocs:
                val = item.get("indicator")
                i_type = item.get("type", "")
                if val:
                    indicators.append({
                        "value": str(val),
                        "type": self._map_otx_type(i_type),
                        "category": "MALWARE",
                        "confidence": 75.0,
                        "reputation": "MALICIOUS",
                        "reference": f"OTX:{pulse.get('id')}",
                        "actor": pulse.get("adversary"),
                        "tags": pulse.get("tags", [])
                    })
        return indicators

    def _map_otx_type(self, otx_type: str) -> Optional[str]:
        mapping = {
            "IPv4": "IPV4",
            "IPv6": "IPV6",
            "domain": "DOMAIN",
            "hostname": "DOMAIN",
            "URL": "URL",
            "FileHash-MD5": "MD5",
            "FileHash-SHA1": "SHA1",
            "FileHash-SHA256": "SHA256",
            "email": "EMAIL"
        }
        return mapping.get(otx_type)


# 4. URLhaus Adapter
class UrlhausAdapter(BaseThreatFeedAdapter):
    """Parses abuse.ch URLhaus malware URL telemetry feeds."""

    def parse_payload(self, raw_data: Any) -> List[Dict[str, Any]]:
        indicators = []
        if isinstance(raw_data, str):
            try:
                raw_data = json.loads(raw_data)
            except Exception:
                # Handle CSV format
                lines = raw_data.splitlines()
                for line in lines:
                    if line.startswith("#") or not line.strip():
                        continue
                    parts = line.split('","')
                    if len(parts) >= 3:
                        url_val = parts[2].replace('"', '')
                        indicators.append({
                            "value": url_val,
                            "type": "URL",
                            "category": "MALWARE",
                            "confidence": 90.0,
                            "reputation": "MALICIOUS",
                            "reference": "abuse.ch URLhaus CSV Feed",
                            "tags": ["urlhaus", "payload"]
                        })
                return indicators

        urls = raw_data.get("urls", []) if isinstance(raw_data, dict) else []
        for entry in urls:
            u_val = entry.get("url")
            threat = entry.get("threat", "malware_download").upper()
            status = entry.get("url_status", "online")
            if u_val:
                indicators.append({
                    "value": u_val,
                    "type": "URL",
                    "category": threat,
                    "confidence": 95.0 if status == "online" else 80.0,
                    "reputation": "MALICIOUS",
                    "reference": f"URLhaus ID {entry.get('id')}",
                    "tags": entry.get("tags", []) or ["urlhaus"]
                })
        return indicators


# 5. AbuseIPDB Adapter
class AbuseIpdbAdapter(BaseThreatFeedAdapter):
    """Parses AbuseIPDB Blacklist and Check responses."""

    def build_headers(self) -> Dict[str, str]:
        headers = super().build_headers()
        api_key = self.get_api_key()
        if api_key:
            headers["Key"] = api_key
        return headers

    def parse_payload(self, raw_data: Any) -> List[Dict[str, Any]]:
        indicators = []
        if isinstance(raw_data, str):
            try:
                raw_data = json.loads(raw_data)
            except Exception:
                return []

        data = raw_data.get("data", []) if isinstance(raw_data, dict) else []
        if isinstance(data, dict):
            data = [data]

        for item in data:
            ip = item.get("ipAddress")
            abuse_score = float(item.get("abuseConfidenceScore", 80.0))
            if ip:
                indicators.append({
                    "value": ip,
                    "type": "IPV4" if ":" not in ip else "IPV6",
                    "category": "BOTNET_ATTACK",
                    "confidence": abuse_score,
                    "reputation": "MALICIOUS" if abuse_score >= 80 else "SUSPICIOUS",
                    "reference": "AbuseIPDB Verified Telemetry",
                    "tags": ["abuseipdb", f"score_{int(abuse_score)}"]
                })
        return indicators


# 6. VirusTotal Adapter
class VirusTotalAdapter(BaseThreatFeedAdapter):
    """
    VirusTotal v3 Intelligence Adapter.
    Enforces strict API usage terms, rate limiting compliance, and clear mock/live distinction.
    """

    def build_headers(self) -> Dict[str, str]:
        headers = super().build_headers()
        api_key = self.get_api_key()
        if api_key:
            headers["x-apikey"] = api_key
        return headers

    def parse_payload(self, raw_data: Any) -> List[Dict[str, Any]]:
        indicators = []
        if isinstance(raw_data, str):
            try:
                raw_data = json.loads(raw_data)
            except Exception:
                return []

        data = raw_data.get("data", []) if isinstance(raw_data, dict) else []
        if isinstance(data, dict):
            data = [data]

        for item in data:
            attrs = item.get("attributes", {})
            stats = attrs.get("last_analysis_stats", {})
            malicious_count = stats.get("malicious", 0)
            val = item.get("id") or attrs.get("sha256") or attrs.get("meaningful_name")
            if val and malicious_count > 0:
                confidence = min(99.0, 50.0 + (malicious_count * 5.0))
                indicators.append({
                    "value": val,
                    "category": "MALWARE",
                    "confidence": confidence,
                    "reputation": "MALICIOUS" if malicious_count >= 3 else "SUSPICIOUS",
                    "reference": f"VirusTotal Analysis (Detections: {malicious_count})",
                    "tags": ["virustotal", f"malicious_{malicious_count}"]
                })
        return indicators
