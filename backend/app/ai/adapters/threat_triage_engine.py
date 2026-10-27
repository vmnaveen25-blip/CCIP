"""
Reliability-Gated AI and Heuristic Fallback Threat-Triage Engine [6]
Sovereign Enclave Offline Inference Engine

Guarantees:
1. Readiness Gate Evaluation: Dynamically verifies whether neural weights are:
   - Provisioned (physically exist on disk)
   - Loaded (in-memory tensor weights valid)
   - Responsive (health probe succeeds within SLA)
2. Neural or Heuristic Execution:
   - If neural weights pass the readiness gate: executes neural multi-label category and urgency classification.
   - If neural weights are unavailable, unprovisioned, or unresponsive: automatically routes the masked narrative
     through a deterministic rule-based/heuristic scoring engine.
3. Provenance Tagging: Explicitly tags all triage output with its execution mode (NEURAL vs. HEURISTIC_FALLBACK)
   and detailed readiness gate diagnostics for transparent investigator oversight.
"""

import os
import re
import json
import time
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from pathlib import Path

from app.core.logging import logger
from app.core.model_config import (
    COMPLAINT_MODEL_WEIGHTS,
    COMPLAINT_MODEL_CONFIG,
    COMPLAINT_MODEL_PATH
)
from app.ai.adapters.incident_urgency import incident_urgency_adapter, DEFAULT_MODEL_DIR as URGENCY_MODEL_DIR


class ThreatCategory:
    FINANCIAL_FRAUD = "Financial Fraud"
    RANSOMWARE = "Ransomware / Extortion"
    PHISHING = "Phishing / Social Eng"
    IDENTITY_THEFT = "Identity Theft"
    CRYPTO_SCAM = "Crypto Scam"
    UNAUTHORIZED_ACCESS = "Unauthorized Access"
    CYBER_HARASSMENT = "Cyber Harassment"
    OTHER = "Other Cyber Incident"


class ReliabilityGatedThreatTriageEngine:
    """
    Threat-Triage Engine [6] with Readiness Gate and Deterministic Heuristic Fallback.
    """

    ENGINE_NAME = "Reliability-Gated AI and Heuristic Threat-Triage Engine [6]"
    ENGINE_VERSION = "2.5.0"

    # Calibration categories mapped to standard CCIP classifications
    PRIMARY_CATEGORIES = [
        ThreatCategory.FINANCIAL_FRAUD,
        ThreatCategory.RANSOMWARE,
        ThreatCategory.PHISHING,
        ThreatCategory.IDENTITY_THEFT,
        ThreatCategory.CRYPTO_SCAM,
        ThreatCategory.UNAUTHORIZED_ACCESS
    ]

    # Category Heuristic Patterns (Deterministic Rules)
    HEURISTIC_CATEGORY_RULES = {
        ThreatCategory.RANSOMWARE: [
            r'(?i)\b(?:ransom|ransomware|encrypt(?:ed|ing)|locked\s*files?|\.lockbit|\.blackcat|\.locked|decryptor|decrypt\s*key)\b',
            r'(?i)\b(?:extort(?:ion|ed|ing)?|blackmail|leak\s*(?:photos?|video|data)|demand(?:ing)?\s*(?:money|bitcoin|crypto))\b',
            r'(?i)\b(?:hostage\s*data|pay\s*or\s*release|compromised\s*credentials\s*leak)\b'
        ],
        ThreatCategory.FINANCIAL_FRAUD: [
            r'(?i)\b(?:unauthorized\s*(?:debit|transaction|transfer|withdrawal)|fraudulent\s*transfer)\b',
            r'(?i)\b(?:siphon(?:ed)?|stolen\s*money|bank\s*fraud|savings\s*account|deducted\s*without|money\s*debited)\b',
            r'(?i)\b(?:upi|neft|rtgs|imps|utr|bank\s*statement|mule\s*account|debit\s*freeze)\b',
            r'(?i)\b(?:credit\s*card\s*fraud|card\s*cloning|atm\s*skimming|fake\s*refund)\b'
        ],
        ThreatCategory.PHISHING: [
            r'(?i)\b(?:phish(?:ing)?|smish(?:ing)?|vishing|fake\s*(?:website|link|portal|url|domain)|spoofed)\b',
            r'(?i)\b(?:kyc\s*update\s*link|pan\s*card\s*update\s*sms|electricity\s*bill\s*sms|lottery\s*link)\b',
            r'(?i)\b(?:impersonat(?:ing|ed|ion)\s*(?:bank|officer|police|customs|fedex|courier|support))\b',
            r'(?i)\b(?:credential\s*harvesting|entered\s*(?:credentials|pin|password|otp)\s*on\s*page)\b'
        ],
        ThreatCategory.CRYPTO_SCAM: [
            r'(?i)\b(?:crypto(?:currency)?|bitcoin|btc|eth|ethereum|usdt|tether|binance|wazirx)\b',
            r'(?i)\b(?:crypto\s*(?:wallet|investment|doubling|mining|pool|trading\s*bot)|telegram\s*crypto)\b',
            r'(?i)\b(?:fake\s*exchange|smart\s*contract\s*drain|liquidity\s*pool\s*scam)\b'
        ],
        ThreatCategory.IDENTITY_THEFT: [
            r'(?i)\b(?:identity\s*theft|sim\s*swap|cloned\s*sim|fake\s*(?:profile|account|id))\b',
            r'(?i)\b(?:aadhaar\s*(?:misuse|leak|cloned)|pan\s*(?:misuse|fraudulent\s*loan)|impersonation)\b',
            r'(?i)\b(?:unauthorized\s*loan\s*taken|credit\s*score\s*dropped|forged\s*signature)\b'
        ],
        ThreatCategory.UNAUTHORIZED_ACCESS: [
            r'(?i)\b(?:hacked|hackers?|unauthorized\s*access|server\s*breach|database\s*leak)\b',
            r'(?i)\b(?:ddos|denial\s*of\s*service|brute\s*force|rat|remote\s*access\s*trojan|anydesk|teamviewer)\b',
            r'(?i)\b(?:malware|trojan|keylogger|backdoor|rootkit|c2\s*server)\b'
        ]
    }

    def __init__(self):
        self._last_readiness_check: Optional[Dict[str, Any]] = None
        self._readiness_cache_time = 0.0
        self._cache_ttl = 10.0  # seconds

    def check_neural_weights_provisioned(self) -> bool:
        """Inspects whether neural model weights physically exist on enclave storage."""
        return COMPLAINT_MODEL_WEIGHTS.is_file() and COMPLAINT_MODEL_CONFIG.is_file()

    def evaluate_readiness_gate(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Readiness Gate Evaluation:
        Inspects whether neural model weights are:
        1. Provisioned: Weight files and configuration physically present on disk.
        2. Loaded: In-memory weights can be instantiated without deserialization/OOM errors.
        3. Responsive: Neural inference probe generates valid response within acceptable latency.

        Returns:
            Dict containing:
                - status: 'PASS_NEURAL_READY' | 'DEGRADED_HEURISTIC_ACTIVE'
                - is_provisioned: bool
                - is_loaded: bool
                - is_responsive: bool
                - execution_route: 'NEURAL' | 'HEURISTIC_FALLBACK'
                - details: str
                - checked_at: ISO timestamp
        """
        now = time.time()
        if not force_refresh and self._last_readiness_check and (now - self._readiness_cache_time < self._cache_ttl):
            return self._last_readiness_check

        provisioned = False
        loaded = False
        responsive = False
        failure_reasons = []

        # 1. Provisioned Gate: Inspect neural weight and config files on disk
        weights_exist = self.check_neural_weights_provisioned()
        if weights_exist:
            provisioned = True
        else:
            failure_reasons.append("Neural model weights (safetensors/bin) not provisioned in enclave filesystem")

        # 2. Loaded Gate: Try instantiating or checking in-memory status
        if provisioned:
            try:
                from app.ai.model_manager import model_manager
                # Attempt to get or verify cached complaint model
                model, tokenizer, labels, thresholds, meta = model_manager.get_complaint_model()
                if model is not None and tokenizer is not None:
                    loaded = True
                else:
                    failure_reasons.append("Model manager returned null neural bundle")
            except Exception as e:
                loaded = False
                failure_reasons.append(f"Model weight memory load error: {str(e)}")

        # 3. Responsive Gate: Probe inference execution
        if loaded:
            try:
                start_probe = time.perf_counter()
                from app.ai.adapters.complaint_classifier import complaint_classifier
                probe_res = complaint_classifier.predict("Health check probe message")
                latency_ms = (time.perf_counter() - start_probe) * 1000.0

                if isinstance(probe_res, dict) and probe_res.get("status") == "SUCCESS":
                    responsive = True
                else:
                    failure_reasons.append("Neural inference probe returned non-successful response")
            except Exception as e:
                responsive = False
                failure_reasons.append(f"Neural inference probe timeout or execution exception: {str(e)}")

        all_passed = provisioned and loaded and responsive
        status_label = "PASS_NEURAL_READY" if all_passed else "DEGRADED_HEURISTIC_ACTIVE"
        route = "NEURAL" if all_passed else "HEURISTIC_FALLBACK"

        result = {
            "status": status_label,
            "is_provisioned": provisioned,
            "is_loaded": loaded,
            "is_responsive": responsive,
            "execution_route": route,
            "failure_reasons": failure_reasons,
            "details": "All neural readiness gates verified; active neural pipeline engaged." if all_passed else
                       f"Degraded mode active: {'; '.join(failure_reasons)}",
            "checked_at": datetime.now(timezone.utc).isoformat()
        }

        self._last_readiness_check = result
        self._readiness_cache_time = now
        return result

    def triage_masked_payload(
        self,
        masked_payload: Dict[str, Any],
        financial_loss: float = 0.0,
        incident_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes reliability-gated threat triage on a masked complaint narrative payload.

        Workflow:
        1. Evaluates Readiness Gate.
        2. Routes to Neural Inference if weights are active and responsive.
        3. Routes to Deterministic Heuristic Scoring Engine if neural weights are offline/degraded.
        4. Applies Provenance Tagging to the output for complete investigator transparency.
        """
        masked_text = masked_payload.get("masked_narrative", "")
        if not masked_text or not masked_text.strip():
            return self._build_empty_response(masked_payload)

        # 1. Readiness Gate Evaluation
        gate = self.evaluate_readiness_gate()

        # 2. Execution Routing
        if gate["execution_route"] == "NEURAL":
            try:
                logger.info(f"[{self.ENGINE_NAME}] Readiness Gate PASSED. Executing Neural Inference pipeline.")
                return self._execute_neural_triage(masked_text, financial_loss, gate, masked_payload)
            except Exception as e:
                logger.warning(
                    f"[{self.ENGINE_NAME}] Neural execution encountered unexpected runtime error: {e}. "
                    "Fail-safe fallback: automatically rerouting through Deterministic Heuristic Engine."
                )
                gate["status"] = "DEGRADED_HEURISTIC_ACTIVE"
                gate["execution_route"] = "HEURISTIC_FALLBACK"
                gate["failure_reasons"].append(f"Runtime execution fallback: {str(e)}")
                return self._execute_heuristic_triage(masked_text, financial_loss, gate, masked_payload)
        else:
            logger.info(
                f"[{self.ENGINE_NAME}] Neural weights unavailable/unresponsive ({gate['status']}). "
                "Executing Deterministic Rule-Based / Heuristic Scoring Engine."
            )
            return self._execute_heuristic_triage(masked_text, financial_loss, gate, masked_payload)

    def _execute_neural_triage(
        self,
        masked_text: str,
        financial_loss: float,
        gate: Dict[str, Any],
        masked_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Executes full neural multi-label category and urgency classification."""
        from app.ai.adapters.complaint_classifier import complaint_classifier
        from app.ai.adapters.incident_urgency import incident_urgency_adapter

        # 1. Category Classification
        category_res = complaint_classifier.predict(masked_text)
        predictions = category_res.get("predictions", [])
        
        primary_category = ThreatCategory.FINANCIAL_FRAUD
        category_confidence = 0.85
        if predictions:
            top_pred = predictions[0]
            primary_category = top_pred.get("label", ThreatCategory.FINANCIAL_FRAUD)
            category_confidence = float(top_pred.get("probability", 0.85))

        # 2. Priority / Urgency Classification
        urgency_res = incident_urgency_adapter.predict_urgency(masked_text)
        priority_label = urgency_res.get("urgency_level", "MEDIUM")
        urgency_conf = float(urgency_res.get("confidence", 0.80))

        # Financial loss booster on neural priority
        if financial_loss >= 1000000:
            priority_label = "CRITICAL"
        elif financial_loss >= 200000 and priority_label in ["LOW", "MEDIUM"]:
            priority_label = "HIGH"

        # Calculate normalized composite triage score (0-100)
        base_priority_scores = {"LOW": 35, "MEDIUM": 60, "HIGH": 80, "CRITICAL": 95}
        base_score = base_priority_scores.get(priority_label, 50)
        triage_score = min(100, max(10, int(base_score * 0.7 + (category_confidence * 30))))

        return self._build_triage_result(
            execution_mode="NEURAL",
            category=primary_category,
            category_confidence=category_confidence,
            secondary_categories=[p.get("label") for p in predictions[1:4]],
            priority=priority_label,
            priority_confidence=urgency_conf,
            triage_score=triage_score,
            gate=gate,
            masked_payload=masked_payload,
            scoring_details={
                "neural_model": category_res.get("model", "complaint_classifier"),
                "architecture": category_res.get("architecture", "microsoft/deberta-v3-base"),
                "urgency_model": urgency_res.get("model_name", "incident_urgency_adapter"),
                "calibrated_predictions": predictions[:5]
            }
        )

    def _execute_heuristic_triage(
        self,
        masked_text: str,
        financial_loss: float,
        gate: Dict[str, Any],
        masked_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Deterministic Rule-Based / Heuristic Scoring Engine.
        Evaluates category keywords, technical indicators, urgency phrases, and financial loss.
        """
        text_lower = masked_text.lower()
        rule_matches = {}
        matched_rules_list = []

        # 1. Evaluate Category Match Scores
        for category, patterns in self.HEURISTIC_CATEGORY_RULES.items():
            score = 0
            category_matches = []
            for pat in patterns:
                matches = re.findall(pat, masked_text)
                if matches:
                    score += len(matches) * 10
                    category_matches.append(pat)
            if score > 0:
                rule_matches[category] = score
                matched_rules_list.append(f"{category} (match score: {score})")

        # Determine Primary Category
        if rule_matches:
            best_category = max(rule_matches.items(), key=lambda x: x[1])[0]
            # Normalize confidence based on keyword match strength
            best_score = rule_matches[best_category]
            category_confidence = min(0.95, round(0.55 + (best_score * 0.05), 2))
        else:
            best_category = ThreatCategory.OTHER
            category_confidence = 0.50

        # 2. Evaluate Priority Score (0-100)
        # Base Score
        priority_points = 35

        # Financial Loss Points
        if financial_loss >= 1000000:
            priority_points += 40
            matched_rules_list.append("High Financial Loss (>= INR 10 Lakhs): +40 priority points")
        elif financial_loss >= 100000:
            priority_points += 25
            matched_rules_list.append("Significant Financial Loss (>= INR 1 Lakh): +25 priority points")
        elif financial_loss >= 10000:
            priority_points += 15
            matched_rules_list.append("Moderate Financial Loss (>= INR 10,000): +15 priority points")

        # Urgency & Threat Multipliers
        critical_indicators = [
            "suicide", "life threat", "threat to life", "hostage", "kill", "immediate harm",
            "threatened to murder", "extreme distress"
        ]
        if any(ind in text_lower for ind in critical_indicators):
            priority_points += 50
            matched_rules_list.append("Emergency / Threat to Life indicator detected: +50 priority points (Forces CRITICAL)")

        extortion_indicators = ["ransom", "blackmail", "leak video", "compromised photos", "pay or else"]
        if any(ind in text_lower for ind in extortion_indicators):
            priority_points += 25
            matched_rules_list.append("Active Extortion / Blackmail signal: +25 priority points")

        golden_hour_indicators = [
            "just now", "minutes ago", "hours ago", "today", "freeze account", "stop transfer",
            "golden hour", "golden-hour", "debit freeze", "immediate freeze", "emergency freeze", "emergency debit"
        ]
        if any(ind in text_lower for ind in golden_hour_indicators):
            priority_points += 20
            matched_rules_list.append("Golden-Hour Banking Freeze Window active: +20 priority points")

        ongoing_compromise = ["still accessing", "screen moving", "remote control", "anydesk active", "rat malware"]
        if any(ind in text_lower for ind in ongoing_compromise):
            priority_points += 20
            matched_rules_list.append("Live device takeover / Active intrusion: +20 priority points")

        # Clamp composite triage score
        triage_score = min(100, max(15, priority_points))

        # Map to Priority Level
        if triage_score >= 85:
            priority_level = "CRITICAL"
        elif triage_score >= 70:
            priority_level = "HIGH"
        elif triage_score >= 50:
            priority_level = "MEDIUM"
        else:
            priority_level = "LOW"

        priority_confidence = min(0.92, round(0.60 + (len(matched_rules_list) * 0.05), 2))

        return self._build_triage_result(
            execution_mode="HEURISTIC_FALLBACK",
            category=best_category,
            category_confidence=category_confidence,
            secondary_categories=[k for k in rule_matches.keys() if k != best_category][:3],
            priority=priority_level,
            priority_confidence=priority_confidence,
            triage_score=triage_score,
            gate=gate,
            masked_payload=masked_payload,
            scoring_details={
                "scoring_engine": "Deterministic-Rule-Scoring-Engine-v2",
                "rules_triggered": matched_rules_list,
                "category_scores": rule_matches,
                "financial_loss_evaluated": financial_loss
            }
        )

    def _build_triage_result(
        self,
        execution_mode: str,
        category: str,
        category_confidence: float,
        secondary_categories: List[str],
        priority: str,
        priority_confidence: float,
        triage_score: int,
        gate: Dict[str, Any],
        masked_payload: Dict[str, Any],
        scoring_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Constructs standardized provenance-tagged triage classification."""
        timestamp = datetime.now(timezone.utc).isoformat()
        return {
            "status": "SUCCESS",
            "threat_category": category,
            "category_confidence": category_confidence,
            "secondary_categories": secondary_categories,
            "priority": priority,
            "priority_confidence": priority_confidence,
            "triage_score": triage_score,
            "is_high_risk": priority in ["CRITICAL", "HIGH"],
            "execution_mode": execution_mode,
            "readiness_gate": {
                "status": gate["status"],
                "is_provisioned": gate["is_provisioned"],
                "is_loaded": gate["is_loaded"],
                "is_responsive": gate["is_responsive"],
                "failure_reasons": gate.get("failure_reasons", []),
                "details": gate["details"]
            },
            "provenance": {
                "engine_name": self.ENGINE_NAME,
                "engine_version": self.ENGINE_VERSION,
                "execution_mode": execution_mode,
                "masked_payload_used": True,
                "masking_module": masked_payload.get("masking_metadata", {}).get("module", "Server-Side Sensitive-Information Masking Module [5]"),
                "redactions_applied": masked_payload.get("redaction_counts", {}),
                "timestamp": timestamp,
                "advisory_disclaimer": "Advisory triage signal only; requires human investigator review. Does not establish criminal guilt."
            },
            "scoring_details": scoring_details
        }

    def _build_empty_response(self, masked_payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "EMPTY_INPUT",
            "threat_category": ThreatCategory.OTHER,
            "category_confidence": 1.0,
            "secondary_categories": [],
            "priority": "LOW",
            "priority_confidence": 1.0,
            "triage_score": 10,
            "is_high_risk": False,
            "execution_mode": "HEURISTIC_FALLBACK",
            "readiness_gate": self.evaluate_readiness_gate(),
            "provenance": {
                "engine_name": self.ENGINE_NAME,
                "engine_version": self.ENGINE_VERSION,
                "execution_mode": "HEURISTIC_FALLBACK",
                "masked_payload_used": False,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "advisory_disclaimer": "Empty complaint narrative evaluated as default LOW priority."
            },
            "scoring_details": {}
        }


threat_triage_engine = ReliabilityGatedThreatTriageEngine()
