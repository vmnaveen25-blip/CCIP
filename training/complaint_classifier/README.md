# CCIP Cybercrime Complaint Classifier - Dataset Pipeline

## Overview
The Complaint Classifier module is designed for multi-label cybercrime classification on citizen complaints and forensic text inputs. It supports simultaneous multi-label categorization across 18 standardized CCIP cybercrime categories, along with a distinct binary `is_cybercrime` indicator (where legitimate traffic is represented by `is_cybercrime = 0, labels = []`).

## Planned Base Model
- Model: `microsoft/deberta-v3-base`
- Task: Multi-label cybercrime classification with binary filtering

## 18 Standard Cybercrime Labels
1. `PHISHING`
2. `UPI_FRAUD`
3. `BANKING_FRAUD`
4. `CARD_FRAUD`
5. `INVESTMENT_SCAM`
6. `JOB_SCAM`
7. `LOAN_APP_FRAUD`
8. `DIGITAL_ARREST`
9. `IDENTITY_THEFT`
10. `ACCOUNT_TAKEOVER`
11. `SOCIAL_MEDIA_CRIME`
12. `ONLINE_SHOPPING_FRAUD`
13. `SEXTORTION`
14. `CYBERSTALKING`
15. `MALWARE_RANSOMWARE`
16. `CRYPTO_FRAUD`
17. `BUSINESS_EMAIL_COMPROMISE`
18. `OTHER` (Cybercrime catch-all only; never assigned to legitimate samples)

Legitimate samples are represented strictly as:
```json
{
  "is_cybercrime": 0,
  "labels": []
}
```

---

## Directory Structure
```
training/complaint_classifier/
├── configs/
│   ├── labels.json              # 18 labels in fixed order (IDs 0-17)
│   ├── source_mapping.json      # Explicit source-to-label mapping rules
│   ├── training_config.json     # Pipeline, seed, split, and DeBERTa configs
│   └── thresholds.json          # Calibrated probability thresholds per class
├── data/
│   ├── raw/                     # Downloaded raw source cache
│   ├── train.jsonl              # 80% train split
│   ├── validation.jsonl         # 10% validation split
│   ├── test.jsonl               # 10% test split
│   └── processed/               # Mirrored splits for pipeline consistency
├── reports/
│   ├── class_distribution.json  # Label counts, percentages, co-occurrence
│   ├── source_distribution.json # Source breakdown and yield
│   ├── duplicate_report.json    # Exact and near duplicate statistics
│   ├── split_report.json        # Split counts and leakage verification
│   └── dataset_audit.md         # Comprehensive human-readable audit
├── scripts/
│   ├── download_datasets.py     # Downloads and caches raw datasets
│   ├── prepare_dataset.py       # Full normalization, dedup, split, and audit
│   ├── evaluate.py              # Computes exact match, hamming, and F1 metrics
│   ├── tune_thresholds.py       # Tunes optimal probability threshold per class
│   └── export_model.py          # Packages model artifacts to backend/ml_models/
├── tests/
│   └── test_dataset_pipeline.py # Pytest validation suite
└── requirements-training.txt    # Preprocessing and training dependencies
```

---

## Pipeline Execution

### 1. Download & Cache Sources
```bash
py training/complaint_classifier/scripts/download_datasets.py
```

### 2. Prepare Dataset, Deduplicate, Split, and Audit
```bash
py training/complaint_classifier/scripts/prepare_dataset.py
```

### 3. Run Test Suite
```bash
py -m pytest training/complaint_classifier/tests/ -v
```

### 4. Evaluate Model Predictions
```bash
py training/complaint_classifier/scripts/evaluate.py --ground-truth training/complaint_classifier/data/test.jsonl --predictions <path_to_preds.jsonl>
```

### 5. Calibrate Per-Class Thresholds
```bash
py training/complaint_classifier/scripts/tune_thresholds.py --ground-truth training/complaint_classifier/data/validation.jsonl --probabilities <path_to_val_probs.jsonl>
```

---

## Normalization & Deduplication Protocol
- **Conservative Normalization:** NFKC Unicode normalization, whitespace standardization, control character stripping, and HTML unescaping. Preserves URLs, UPI handles, domains, amounts, and scam keywords. Configurable PII masking is supported (`<PHONE>`, `<EMAIL>`, `<UPI_ID>`, `<BANK_ACCOUNT>`, `<CARD_NUMBER>`).
- **Multi-Stage Deduplication:** Exact hash matching, normalized text matching, structural template fingerprinting, and near-duplicate ratio clustering using `rapidfuzz`.
- **Grouped Leak-Free Splitting:** Splits are partitioned by `template_group` / `duplicate_group` using deterministic random seed `42`. No near-duplicate or template variant crosses between train, validation, or test splits.
