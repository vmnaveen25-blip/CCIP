"""
Explainable Multi-Factor Threat Scoring Engine
Calculates transparent, fully attributable threat composite scores and manages finding states.
Strictly forbids black-box AI attribution or automated criminal guilt assumptions.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List


class ThreatFindingState:
    UNVERIFIED = "UNVERIFIED"
    OBSERVED = "OBSERVED"
    EXTERNALLY_REPORTED = "EXTERNALLY_REPORTED"
    AI_SUGGESTED = "AI_SUGGESTED"
    HUMAN_REVIEWED = "HUMAN_REVIEWED"
    CONFIRMED = "CONFIRMED"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    EXPIRED = "EXPIRED"

    ALL_STATES = [
        UNVERIFIED,
        OBSERVED,
        EXTERNALLY_REPORTED,
        AI_SUGGESTED,
        HUMAN_REVIEWED,
        CONFIRMED,
        FALSE_POSITIVE,
        EXPIRED
    ]


class ThreatScoringEngine:
    """
    Computes an explainable composite threat score based on:
    1. Source Reliability (Admiralty System B2 standard) [weight: 0.25]
    2. Indicator Confidence reported by source [weight: 0.25]
    3. Reputation Verdict factor (Malicious, Suspicious, Neutral) [weight: 0.20]
    4. Recency Decay factor (temporal relevance) [weight: 0.15]
    5. Independent Corroborating Sources count [weight: 0.15]
    
    Plus contextual modifiers:
    - Internal Case Evidence Match (+10% modifier)
    - Human Reviewer Confirmation (+15% modifier)
    - False Positive flag (forces composite score to 0.0)
    """

    REPUTATION_WEIGHTS = {
        "MALICIOUS": 1.0,
        "SUSPICIOUS": 0.65,
        "NEUTRAL": 0.30,
        "BENIGN": 0.0
    }

    @classmethod
    def calculate_recency_factor(cls, last_seen: Optional[datetime]) -> float:
        """Calculates temporal decay. Indicators seen within 7 days get 1.0, decaying over 90 days."""
        if not last_seen:
            return 0.50

        # Ensure timezone-aware
        if last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)

        age_days = (datetime.now(timezone.utc) - last_seen).total_seconds() / 86400.0
        if age_days <= 7:
            return 1.0
        elif age_days <= 30:
            return 0.85
        elif age_days <= 60:
            return 0.60
        elif age_days <= 90:
            return 0.40
        else:
            return max(0.15, 1.0 - (age_days / 180.0))

    @classmethod
    def calculate_composite_score(
        cls,
        source_reliability: float,          # 0.0 to 1.0
        reported_confidence: float,        # 0.0 to 100.0
        reputation_verdict: str,           # "MALICIOUS", "SUSPICIOUS", "NEUTRAL", "BENIGN"
        last_seen: Optional[datetime],
        independent_sources_count: int = 1,
        is_correlated_with_case_evidence: bool = False,
        is_human_reviewed: bool = False,
        is_false_positive: bool = False
    ) -> Dict[str, Any]:
        """
        Produces an explainable breakdown and composite score (0 to 100).
        """
        if is_false_positive:
            return {
                "composite_score": 0.0,
                "severity": "LOW",
                "finding_state": ThreatFindingState.FALSE_POSITIVE,
                "breakdown": {
                    "source_reliability_score": 0.0,
                    "reported_confidence_score": 0.0,
                    "reputation_factor": 0.0,
                    "recency_factor": 0.0,
                    "corroboration_score": 0.0,
                    "internal_evidence_bonus": 0.0,
                    "human_verification_bonus": 0.0,
                    "false_positive_override": True
                },
                "explanation": "Finding marked as FALSE_POSITIVE by authorized investigator. Threat score nullified."
            }

        # Normalize components to 0.0 - 1.0
        rel_factor = max(0.0, min(1.0, float(source_reliability)))
        conf_factor = max(0.0, min(1.0, float(reported_confidence) / 100.0))
        rep_factor = cls.REPUTATION_WEIGHTS.get(reputation_verdict.upper(), 0.50)
        rec_factor = cls.calculate_recency_factor(last_seen)

        # Corroboration factor: 1 source = 0.5, 2 = 0.75, 3+ = 1.0
        corroboration_factor = min(1.0, 0.4 + (independent_sources_count * 0.2))

        # Base composite calculation (0.0 to 1.0)
        base_score = (
            (rel_factor * 0.25) +
            (conf_factor * 0.25) +
            (rep_factor * 0.20) +
            (rec_factor * 0.15) +
            (corroboration_factor * 0.15)
        )

        # Modifiers
        evidence_bonus = 0.10 if is_correlated_with_case_evidence else 0.0
        human_bonus = 0.15 if is_human_reviewed else 0.0

        final_composite = min(1.0, base_score + evidence_bonus + human_bonus)
        scaled_score = round(final_composite * 100.0, 2)

        # Severity band
        if scaled_score >= 85.0:
            severity = "CRITICAL"
        elif scaled_score >= 65.0:
            severity = "HIGH"
        elif scaled_score >= 40.0:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Determine finding state (Rule: high score never automatically causes CONFIRMED)
        if is_human_reviewed:
            finding_state = ThreatFindingState.HUMAN_REVIEWED
        elif is_correlated_with_case_evidence:
            finding_state = ThreatFindingState.OBSERVED
        elif independent_sources_count > 0:
            finding_state = ThreatFindingState.EXTERNALLY_REPORTED
        else:
            finding_state = ThreatFindingState.UNVERIFIED

        explanation_parts = [
            f"Source reliability factor: {rel_factor:.2f} (weight 25%)",
            f"Reported indicator confidence: {conf_factor:.2f} (weight 25%)",
            f"Reputation verdict '{reputation_verdict}': {rep_factor:.2f} (weight 20%)",
            f"Temporal recency factor: {rec_factor:.2f} (weight 15%)",
            f"Independent corroboration ({independent_sources_count} sources): {corroboration_factor:.2f} (weight 15%)"
        ]
        if is_correlated_with_case_evidence:
            explanation_parts.append("Internal case evidence match bonus: +10%")
        if is_human_reviewed:
            explanation_parts.append("Human analyst verification bonus: +15%")

        return {
            "composite_score": scaled_score,
            "severity": severity,
            "finding_state": finding_state,
            "breakdown": {
                "source_reliability_score": round(rel_factor * 25.0, 2),
                "reported_confidence_score": round(conf_factor * 25.0, 2),
                "reputation_factor": round(rep_factor * 20.0, 2),
                "recency_factor": round(rec_factor * 15.0, 2),
                "corroboration_score": round(corroboration_factor * 15.0, 2),
                "internal_evidence_bonus": round(evidence_bonus * 100.0, 2),
                "human_verification_bonus": round(human_bonus * 100.0, 2),
                "false_positive_override": False
            },
            "explanation": " | ".join(explanation_parts)
        }


threat_scoring_engine = ThreatScoringEngine()
