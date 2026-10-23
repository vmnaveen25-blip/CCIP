import hashlib
import re
from typing import Any, Dict, List, Optional, Set, Tuple
from rapidfuzz import fuzz

from ..utils.hashing import compute_sha256, compute_template_fingerprint


class DeduplicationPipeline:
    """
    Comprehensive multi-stage deduplication and grouping engine:
    1. Exact duplicate detection
    2. Normalized-text duplicate detection
    3. Template/campaign grouping
    4. Near-duplicate clustering
    """

    def __init__(
        self,
        similarity_threshold: float = 0.90,
        enable_near_dedup: bool = True,
    ):
        self.similarity_threshold = similarity_threshold
        self.enable_near_dedup = enable_near_dedup

        # Tracking state
        self.seen_exact_hashes: Dict[str, str] = {}  # hash -> canonical_record_id
        self.seen_norm_hashes: Dict[str, str] = {}   # norm_hash -> canonical_record_id
        self.template_groups: Dict[str, str] = {}    # template_hash -> group_id

        # Stats
        self.stats = {
            "total_input": 0,
            "exact_duplicates": 0,
            "normalized_duplicates": 0,
            "near_duplicates": 0,
            "unique_records": 0,
            "template_groups_count": 0,
        }

    def process_records(
        self,
        records: List[Dict[str, Any]],
        dedup_mode: str = "keep_first",
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Process a list of records, filtering duplicates and assigning template_group
        and duplicate_group to prevent cross-split leakage.
        """
        accepted_records: List[Dict[str, Any]] = []
        # Store canonical texts for near-duplicate comparison within template or domain
        canonical_by_template: Dict[str, List[Tuple[str, str]]] = {}  # template_id -> [(rec_id, text)]

        for rec in records:
            self.stats["total_input"] += 1
            raw_text = rec["text"]
            norm_text = re.sub(r"\s+", " ", raw_text.strip().lower())

            exact_hash = compute_sha256(raw_text)
            norm_hash = compute_sha256(norm_text)
            template_hash = compute_template_fingerprint(raw_text)

            rec_id = rec["id"]

            # 1. Exact Duplicate
            if exact_hash in self.seen_exact_hashes:
                self.stats["exact_duplicates"] += 1
                rec["duplicate_group"] = self.seen_exact_hashes[exact_hash]
                rec["template_group"] = self.template_groups.get(template_hash, template_hash)
                continue

            # 2. Normalized Text Duplicate
            if norm_hash in self.seen_norm_hashes:
                self.stats["normalized_duplicates"] += 1
                rec["duplicate_group"] = self.seen_norm_hashes[norm_hash]
                rec["template_group"] = self.template_groups.get(template_hash, template_hash)
                continue

            # Group ID for new canonical record
            group_id = rec_id
            self.seen_exact_hashes[exact_hash] = group_id
            self.seen_norm_hashes[norm_hash] = group_id

            # 3. Template Grouping
            if template_hash not in self.template_groups:
                self.template_groups[template_hash] = f"tmpl_{template_hash}"
                canonical_by_template[template_hash] = []
            tmpl_group_id = self.template_groups[template_hash]

            # 4. Near-Duplicate Check within template bucket
            is_near_dup = False
            if self.enable_near_dedup and template_hash in canonical_by_template:
                for canon_id, canon_text in canonical_by_template[template_hash]:
                    sim = fuzz.ratio(norm_text, canon_text) / 100.0
                    if sim >= self.similarity_threshold:
                        is_near_dup = True
                        group_id = canon_id
                        self.stats["near_duplicates"] += 1
                        break

            if not is_near_dup:
                canonical_by_template[template_hash].append((group_id, norm_text))

            rec["duplicate_group"] = group_id
            rec["template_group"] = tmpl_group_id

            accepted_records.append(rec)

        self.stats["unique_records"] = len(accepted_records)
        self.stats["template_groups_count"] = len(self.template_groups)

        return accepted_records, self.stats
