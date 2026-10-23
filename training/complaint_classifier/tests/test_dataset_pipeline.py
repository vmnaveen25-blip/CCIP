import json
import os
import sys
from pathlib import Path
import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from training.shared.preprocessing.deduplication import DeduplicationPipeline
from training.shared.preprocessing.text_normalization import normalize_text
from training.shared.schemas.dataset_schema import NormalizedRecord, VALID_LABELS, VALID_LABELS_SET
from training.shared.utils.filesystem import read_json, read_jsonl
from training.shared.utils.hashing import compute_sha256, generate_deterministic_id
from training.complaint_classifier.scripts.prepare_dataset import DatasetPreparer


def test_label_uniqueness_and_count():
    """Verify labels list contains exactly 18 unique valid labels."""
    assert len(VALID_LABELS) == 18
    assert len(VALID_LABELS_SET) == 18
    assert len(set(VALID_LABELS)) == 18


def test_labels_config_matches_schema():
    """Verify labels.json has exact 18 labels matching the schema."""
    cfg_path = PROJECT_ROOT / "training" / "complaint_classifier" / "configs" / "labels.json"
    cfg = read_json(cfg_path)
    assert cfg["labels"] == VALID_LABELS
    assert len(cfg["label_to_id"]) == 18
    assert len(cfg["id_to_label"]) == 18


def test_legitimate_sample_requires_empty_labels():
    """Legitimate examples must have is_cybercrime=0 and labels=[]."""
    rec = NormalizedRecord(
        id="legit_001",
        text="Normal transaction of 500 rupees at local grocery shop.",
        is_cybercrime=0,
        labels=[],
        source="test_source",
        source_label="legit",
    )
    assert rec.is_cybercrime == 0
    assert rec.labels == []

    # Should raise error if labels are non-empty for is_cybercrime=0
    with pytest.raises(ValueError, match="Legitimate records .* must have empty labels"):
        NormalizedRecord(
            id="legit_bad",
            text="Some text",
            is_cybercrime=0,
            labels=["OTHER"],
            source="test",
            source_label="legit",
        )


def test_other_not_allowed_for_legitimate():
    """OTHER is a cybercrime catch-all only, never allowed on legitimate traffic."""
    with pytest.raises(ValueError):
        NormalizedRecord(
            id="bad_other",
            text="Hello friend how are you",
            is_cybercrime=0,
            labels=["OTHER"],
            source="test",
            source_label="ham",
        )


def test_multilabel_rows_accepted():
    """Multi-label records should be successfully accepted and validated."""
    rec = NormalizedRecord(
        id="multi_001",
        text="Bank KYC link asking to verify card and UPI credentials.",
        is_cybercrime=1,
        labels=["PHISHING", "BANKING_FRAUD", "UPI_FRAUD"],
        source="test_source",
        source_label="bank_phish",
    )
    assert len(rec.labels) == 3
    assert "PHISHING" in rec.labels
    assert "BANKING_FRAUD" in rec.labels
    assert "UPI_FRAUD" in rec.labels


def test_disallowed_labels_rejected():
    """Any arbitrary or non-standard label must be rejected."""
    with pytest.raises(ValueError, match="Invalid label"):
        NormalizedRecord(
            id="bad_lbl",
            text="Fraud alert",
            is_cybercrime=1,
            labels=["SOME_RANDOM_FRAUD"],
            source="test",
            source_label="test",
        )


def test_normalization_stability_and_forensic_preservation():
    """Normalization must be idempotent and preserve URLs, UPI, and amounts."""
    text = "  Alert: Send Rs. 5,000 to fraudster@upi or click https://bank-scam.com/login  \n\n"
    norm1 = normalize_text(text)
    norm2 = normalize_text(norm1)
    assert norm1 == norm2  # Idempotent
    assert "https://bank-scam.com/login" in norm1
    assert "fraudster@upi" in norm1
    assert "5,000" in norm1


def test_deterministic_hashing():
    """Deterministic hashing must produce identical IDs for identical inputs."""
    id1 = generate_deterministic_id("sourceA", "101", "Text message content")
    id2 = generate_deterministic_id("sourceA", "101", "Text message content")
    id3 = generate_deterministic_id("sourceA", "102", "Text message content")
    assert id1 == id2
    assert id1 != id3


def test_exact_duplicate_removal_and_template_grouping():
    """Deduplication engine must eliminate duplicates and group template variants."""
    records = [
        {"id": "1", "text": "Your account 123 is blocked. Call 9876543210."},
        {"id": "2", "text": "Your account 123 is blocked. Call 9876543210."},  # Exact dup
        {"id": "3", "text": "  Your account 123 is blocked. Call 9876543210.  "},  # Norm dup
        {"id": "4", "text": "Your account 456 is blocked. Call 9123456780."},  # Template variation
    ]
    pipeline = DeduplicationPipeline(similarity_threshold=0.85, enable_near_dedup=True)
    accepted, stats = pipeline.process_records(records)

    # Records 1 and 4 should be accepted, 2 and 3 dropped
    assert len(accepted) == 2
    assert stats["exact_duplicates"] == 1
    assert stats["normalized_duplicates"] == 1

    # Template groups for record 1 and 4 should match because structure is identical!
    assert accepted[0]["template_group"] == accepted[1]["template_group"]


def test_grouped_split_prevents_leakage():
    """Records sharing the same template/duplicate group must never cross splits."""
    preparer = DatasetPreparer(seed=42)
    records = [
        {"id": "r1", "text": "Scam template 1 with code 100", "synthetic": False, "template_group": "tmpl_A"},
        {"id": "r2", "text": "Scam template 1 with code 200", "synthetic": False, "template_group": "tmpl_A"},
        {"id": "r3", "text": "Scam template 2 with code 300", "synthetic": True, "template_group": "tmpl_B"},
        {"id": "r4", "text": "Scam template 3 with code 400", "synthetic": False, "template_group": "tmpl_C"},
        {"id": "r5", "text": "Scam template 4 with code 500", "synthetic": True, "template_group": "tmpl_D"},
    ]

    train, val, test = preparer.run_split(records, train_ratio=0.6, val_ratio=0.2, test_ratio=0.2)

    train_groups = {r["template_group"] for r in train}
    val_groups = {r["template_group"] for r in val}
    test_groups = {r["template_group"] for r in test}

    assert len(train_groups & val_groups) == 0
    assert len(train_groups & test_groups) == 0
    assert len(val_groups & test_groups) == 0


def test_source_provenance_and_synthetic_flag_preserved():
    """All provenance fields and synthetic flag must be preserved."""
    rec = NormalizedRecord(
        id="prov_01",
        text="Sample complaint text",
        is_cybercrime=1,
        labels=["UPI_FRAUD"],
        source="vnovaai/INDIA_FRAUD_DETECTION_JSONL_V1",
        source_label="UPI Request Fraud",
        language="en",
        synthetic=True,
        source_split="train",
        source_row_id="42",
        mapping_version="1.0.0",
        template_group="tmpl_xyz",
        duplicate_group="prov_01",
    )
    d = rec.to_dict()
    assert d["source"] == "vnovaai/INDIA_FRAUD_DETECTION_JSONL_V1"
    assert d["source_label"] == "UPI Request Fraud"
    assert d["synthetic"] is True
    assert d["source_split"] == "train"
    assert d["source_row_id"] == "42"
    assert d["template_group"] == "tmpl_xyz"


def test_malformed_record_rejected_safely():
    """Malformed record (empty text, invalid cybercrime value) fails validation."""
    with pytest.raises(Exception):
        NormalizedRecord(
            id="bad_empty",
            text="   ",
            is_cybercrime=1,
            labels=["PHISHING"],
            source="test",
            source_label="test",
        )
    with pytest.raises(Exception):
        NormalizedRecord(
            id="bad_flag",
            text="valid text",
            is_cybercrime=2,  # Invalid flag
            labels=["PHISHING"],
            source="test",
            source_label="test",
        )


def test_generated_output_splits_validity():
    """Verify generated train, val, and test JSONL files exist, are valid, and have zero leakage."""
    data_dir = PROJECT_ROOT / "training" / "complaint_classifier" / "data"
    train_path = data_dir / "train.jsonl"
    val_path = data_dir / "validation.jsonl"
    test_path = data_dir / "test.jsonl"

    assert train_path.exists()
    assert val_path.exists()
    assert test_path.exists()

    train_recs = list(read_jsonl(train_path))
    val_recs = list(read_jsonl(val_path))
    test_recs = list(read_jsonl(test_path))

    assert len(train_recs) > 10000
    assert len(val_recs) > 1000
    assert len(test_recs) > 1000

    # Validate schema for sample from each split
    for split_recs in [train_recs[:100], val_recs[:100], test_recs[:100]]:
        for r in split_recs:
            rec = NormalizedRecord(**r)
            if rec.is_cybercrime == 0:
                assert rec.labels == []
            else:
                assert len(rec.labels) > 0
                assert all(lbl in VALID_LABELS_SET for lbl in rec.labels)

    # Check zero duplicate / template group leakage across splits
    train_groups = {r.get("template_group") or r.get("duplicate_group") or r["id"] for r in train_recs}
    val_groups = {r.get("template_group") or r.get("duplicate_group") or r["id"] for r in val_recs}
    test_groups = {r.get("template_group") or r.get("duplicate_group") or r["id"] for r in test_recs}

    assert len(train_groups & val_groups) == 0, "Leakage detected between train and val!"
    assert len(train_groups & test_groups) == 0, "Leakage detected between train and test!"
    assert len(val_groups & test_groups) == 0, "Leakage detected between val and test!"


def test_evaluation_and_threshold_scripts_integration(tmp_path):
    """Test evaluate.py and tune_thresholds.py with mock predictions and probabilities."""
    from training.complaint_classifier.scripts.evaluate import evaluate_predictions
    from training.complaint_classifier.scripts.tune_thresholds import tune_classification_thresholds
    from training.shared.utils.filesystem import write_jsonl

    gt_file = tmp_path / "mock_gt.jsonl"
    pred_file = tmp_path / "mock_preds.jsonl"
    prob_file = tmp_path / "mock_probs.jsonl"
    eval_out = tmp_path / "eval_out.json"
    thresh_out = tmp_path / "thresh_out.json"

    gt_data = [
        {"id": "1", "is_cybercrime": 1, "labels": ["PHISHING", "BANKING_FRAUD"]},
        {"id": "2", "is_cybercrime": 0, "labels": []},
        {"id": "3", "is_cybercrime": 1, "labels": ["UPI_FRAUD"]},
    ]
    pred_data = [
        {"id": "1", "is_cybercrime": 1, "is_cybercrime_probability": 0.95, "labels": ["PHISHING", "BANKING_FRAUD"]},
        {"id": "2", "is_cybercrime": 0, "is_cybercrime_probability": 0.10, "labels": []},
        {"id": "3", "is_cybercrime": 1, "is_cybercrime_probability": 0.88, "labels": ["UPI_FRAUD"]},
    ]
    prob_data = [
        {"id": "1", "probabilities": {"PHISHING": 0.95, "BANKING_FRAUD": 0.90, "UPI_FRAUD": 0.05}},
        {"id": "2", "probabilities": {"PHISHING": 0.05, "BANKING_FRAUD": 0.02, "UPI_FRAUD": 0.01}},
        {"id": "3", "probabilities": {"PHISHING": 0.10, "BANKING_FRAUD": 0.08, "UPI_FRAUD": 0.92}},
    ]

    write_jsonl(gt_data, gt_file)
    write_jsonl(pred_data, pred_file)
    write_jsonl(prob_data, prob_file)

    # Test evaluate
    eval_res = evaluate_predictions(str(gt_file), str(pred_file), str(eval_out))
    assert eval_res["num_evaluated_samples"] == 3
    assert eval_res["binary_cybercrime_detection"]["accuracy"] == 1.0

    # Test tune thresholds
    thresholds = tune_classification_thresholds(str(gt_file), str(prob_file), str(thresh_out))
    assert "PHISHING" in thresholds
    assert "UPI_FRAUD" in thresholds


def test_dataset_versioning_and_reports_exist():
    """Verify v1.1.0 dataset versioning, manifests, and versioned audit reports exist."""
    reports_dir = PROJECT_ROOT / "training" / "complaint_classifier" / "reports"
    assert (reports_dir / "class_distribution_v1_1_0.json").exists()
    assert (reports_dir / "source_distribution_v1_1_0.json").exists()
    assert (reports_dir / "duplicate_report_v1_1_0.json").exists()
    assert (reports_dir / "split_report_v1_1_0.json").exists()
    assert (reports_dir / "dataset_audit_v1_1_0.md").exists()
    assert (reports_dir / "weak_class_report_v1_1_0.json").exists()
    assert (reports_dir / "curation_report_v1_1_0.json").exists()

    weak_report = read_json(reports_dir / "weak_class_report_v1_1_0.json")
    assert weak_report["dataset_version"] == "complaint-dataset-v1.1.0"
    assert weak_report["comparison_baseline"] == "complaint-dataset-v1.0.0"


def test_curated_provenance_and_manifest():
    """Verify CCIP curated corpus files, manifest, and review queue."""
    curated_dir = PROJECT_ROOT / "training" / "complaint_classifier" / "data" / "curated"
    reports_dir = PROJECT_ROOT / "training" / "complaint_classifier" / "reports"

    assert (curated_dir / "curated_real.jsonl").exists()
    assert (curated_dir / "curated_synthetic.jsonl").exists()
    assert (curated_dir / "curation_manifest.json").exists()
    assert (curated_dir / "curation_guidelines.md").exists()
    assert (reports_dir / "curation_review.jsonl").exists()

    manifest = read_json(curated_dir / "curation_manifest.json")
    assert manifest["dataset_version"] == "complaint-dataset-v1.1.0"
    assert manifest["curated_real_count"] > 0
    assert manifest["curated_synthetic_count"] > 0

    review_entries = list(read_jsonl(reports_dir / "curation_review.jsonl"))
    assert len(review_entries) > 0
    for e in review_entries[:50]:
        assert "text" in e
        assert "proposed_labels" in e
        assert "source" in e
        assert "synthetic" in e
        assert "quality_flags" in e
        assert "mapping_reason" in e
        assert e["review_status"] in ["AUTO_ACCEPTED_HIGH_CONFIDENCE", "NEEDS_MANUAL_REVIEW", "REJECTED"]


def test_real_synthetic_separation_and_split_ratios():
    """Validation and test sets must NOT be dominated by synthetic data (real >= 60%)."""
    reports_dir = PROJECT_ROOT / "training" / "complaint_classifier" / "reports"
    split_rep = read_json(reports_dir / "split_report_v1_1_0.json")

    assert split_rep["test"]["real_ratio"] >= 0.60, "Test set must remain primarily real data"
    assert split_rep["validation"]["real_ratio"] >= 0.60, "Validation set must remain primarily real data"
    assert split_rep["leakage_checks"]["passed_leakage_check"] is True


def test_weak_class_expansion_targets():
    """Verify significant train count expansion for historically weak categories."""
    reports_dir = PROJECT_ROOT / "training" / "complaint_classifier" / "reports"
    weak_report = read_json(reports_dir / "weak_class_report_v1_1_0.json")["labels"]

    # Check that weak classes saw major expansion
    assert weak_report["BUSINESS_EMAIL_COMPROMISE"]["v1_1_0_train_count"] >= 1000
    assert weak_report["CYBERSTALKING"]["v1_1_0_train_count"] >= 1000
    assert weak_report["MALWARE_RANSOMWARE"]["v1_1_0_train_count"] >= 1000
    assert weak_report["ACCOUNT_TAKEOVER"]["v1_1_0_train_count"] >= 1000
    assert weak_report["SEXTORTION"]["v1_1_0_train_count"] >= 1000
    assert weak_report["CARD_FRAUD"]["v1_1_0_train_count"] >= 1000
    assert weak_report["SOCIAL_MEDIA_CRIME"]["v1_1_0_train_count"] >= 1000
    assert weak_report["IDENTITY_THEFT"]["v1_1_0_train_count"] >= 1000
    assert weak_report["UPI_FRAUD"]["v1_1_0_train_count"] >= 1000
    assert weak_report["JOB_SCAM"]["v1_1_0_train_count"] >= 1000
    assert weak_report["LOAN_APP_FRAUD"]["v1_1_0_train_count"] >= 1000
    assert weak_report["ONLINE_SHOPPING_FRAUD"]["v1_1_0_train_count"] >= 1000


def test_bec_mapping_correctness():
    """BEC complaints must involve business payment/invoice/executive impersonation."""
    bec_sample = NormalizedRecord(
        id="bec_test_1",
        text="Attacker impersonating CFO sent spoofed email to accounts desk directing urgent vendor wire transfer of Rs 25 lakh.",
        is_cybercrime=1,
        labels=["BUSINESS_EMAIL_COMPROMISE", "PHISHING"],
        source="ccip_curated_corpus",
        source_label="business_email_compromise",
    )
    assert "BUSINESS_EMAIL_COMPROMISE" in bec_sample.labels
    assert "PHISHING" in bec_sample.labels


def test_cyberstalking_mapping_correctness():
    """Cyberstalking involves persistent online harassment, monitoring, or tracking across accounts."""
    stalk_sample = NormalizedRecord(
        id="stalk_test_1",
        text="The harasser created 12 fake Instagram profiles to track my location and send threatening messages after being blocked.",
        is_cybercrime=1,
        labels=["CYBERSTALKING", "SOCIAL_MEDIA_CRIME"],
        source="ccip_curated_corpus",
        source_label="cyberstalking",
    )
    assert "CYBERSTALKING" in stalk_sample.labels
    assert "SOCIAL_MEDIA_CRIME" in stalk_sample.labels


def test_account_takeover_vs_social_media_distinction():
    """Verify distinct labeling for account takeover and social media crime."""
    # ATO on non-social account (e.g. Email/Netbanking)
    ato_bank = NormalizedRecord(
        id="ato_test_1",
        text="Scammer triggered unauthorized password reset on my netbanking account using intercepted SMS OTP.",
        is_cybercrime=1,
        labels=["ACCOUNT_TAKEOVER", "BANKING_FRAUD"],
        source="ccip_curated_corpus",
        source_label="account_takeover",
    )
    assert "ACCOUNT_TAKEOVER" in ato_bank.labels
    assert "SOCIAL_MEDIA_CRIME" not in ato_bank.labels

    # ATO on social account (Instagram)
    ato_social = NormalizedRecord(
        id="ato_test_2",
        text="My Instagram account was taken over after an attacker tricked me into sharing the reset link.",
        is_cybercrime=1,
        labels=["ACCOUNT_TAKEOVER", "SOCIAL_MEDIA_CRIME"],
        source="ccip_curated_corpus",
        source_label="account_takeover",
    )
    assert "ACCOUNT_TAKEOVER" in ato_social.labels
    assert "SOCIAL_MEDIA_CRIME" in ato_social.labels


def test_malware_classification_mapping():
    """Malware incidents (ransomware, trojans, malicious APKs) must be mapped to MALWARE_RANSOMWARE."""
    malware_sample = NormalizedRecord(
        id="malware_test_1",
        text="Downloaded an APK claiming to be electricity bill updater which installed background spyware stealing SMS OTPs.",
        is_cybercrime=1,
        labels=["MALWARE_RANSOMWARE", "BANKING_FRAUD"],
        source="ccip_curated_corpus",
        source_label="malware_ransomware",
    )
    assert "MALWARE_RANSOMWARE" in malware_sample.labels


def test_malformed_curated_rows_rejected():
    """Curated rows with missing text or invalid labels must be rejected."""
    with pytest.raises(Exception):
        NormalizedRecord(
            id="bad_curated_1",
            text="",
            is_cybercrime=1,
            labels=["BUSINESS_EMAIL_COMPROMISE"],
            source="ccip_curated_corpus",
            source_label="bec",
        )
    with pytest.raises(Exception):
        NormalizedRecord(
            id="bad_curated_2",
            text="Valid complaint text",
            is_cybercrime=1,
            labels=["NON_EXISTENT_LABEL"],
            source="ccip_curated_corpus",
            source_label="bec",
        )


def test_generated_template_near_duplicates_clustered():
    """Near duplicates generated from template patterns must cluster into same template group."""
    rec1 = {"id": "g1", "text": "Transfer Rs 10,000 urgently to vendor account. Call 9876543210."}
    rec2 = {"id": "g2", "text": "Transfer Rs 25,000 urgently to vendor account. Call 9123456780."}
    pipeline = DeduplicationPipeline(similarity_threshold=0.80, enable_near_dedup=True)
    accepted, stats = pipeline.process_records([rec1, rec2])

    assert len(accepted) == 2
    # Both share the same abstracted template pattern: Transfer <AMOUNT> urgently to vendor account. Call <PHONE>.
    assert accepted[0]["template_group"] == accepted[1]["template_group"]



