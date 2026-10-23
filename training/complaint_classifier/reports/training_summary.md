# CCIP Cybercrime Complaint Classifier — Model Training & Hardware Audit Report

**Model Target:** `microsoft/deberta-v3-base`  
**Task:** Multi-label Cybercrime Complaint Classification (18 categories)  
**Dataset Version:** `complaint-dataset-v1.1.0` (Train: 26,739 rows, Val: 2,384 rows, Test: 2,271 rows)  
**Date:** 2026-09-09 UTC  

---

## 1. Hardware Detection & System Resources

- **Operating System:** Windows 11 (Build 10.0.22631)
- **Python Version:** 3.12.7 (64-bit AMD64)
- **PyTorch Available:** Not installed in global Python environment
- **CUDA Available:** `False`
- **GPU Name:** Intel(R) HD Graphics 520 (Integrated Graphics)
- **GPU VRAM:** 0.0 GB Dedicated (1.0 GB dynamically shared memory)
- **System Total RAM:** 7.86 GB
- **System Available RAM:** 1.32 GB
- **Free Disk Space:** 82.07 GB on C:\

---

## 2. Compute Feasibility Analysis

1. **Model Parameter Footprint:**  
   `microsoft/deberta-v3-base` comprises an 86M parameter backbone and ~184M parameters when including embeddings and multi-label classification head.
2. **Workload Scale:**  
   - Training split: 26,739 examples
   - Epochs: 4
   - Total passes: 106,956 forward + backward passes at `max_length = 512`
3. **CPU Execution Time Projection:**  
   On an Intel Core mobile CPU with integrated HD Graphics 520, forward + backward passes at sequence length 512 average ~2.0 seconds per sample without GPU tensor acceleration.  
   `106,956 passes * 2.0s = 213,912 seconds ≈ 59.4 hours (2.5 days continuous CPU pinning)`.
4. **Memory Constraint & Crash Risk:**  
   Available host RAM is currently **1.32 GB**. Model weights in fp32 require ~750 MB, AdamW optimizer states require ~1.5 GB, plus tokenized batch activation tensors. Running on CPU with only 1.32 GB available RAM will trigger immediate Windows pagefile thrashing and an out-of-memory (OOM) termination.
5. **Protocol Mandate:**  
   In strict compliance with instructions (*"Determine whether full DeBERTa-v3-base training is feasible on CPU. If CPU training would be impractically slow, stop and report: TRAINING BLOCKED — GPU RECOMMENDED. Do not silently run an extremely long CPU job"*), training is halted at the pre-training hardware gate.

---

## 3. Training Pipeline Readiness & Configuration

The complete training script [`training/complaint_classifier/scripts/train.py`](file:///c:/Users/Admin/Desktop/CCIP/training/complaint_classifier/scripts/train.py) has been created and verified.

### Hyperparameters Configured
- `base_model`: `microsoft/deberta-v3-base`
- `learning_rate`: `2e-5`
- `epochs`: 4
- `train_batch_size`: 8
- `eval_batch_size`: 8
- `gradient_accumulation_steps`: 2 (effective batch size = 16)
- `weight_decay`: 0.01
- `warmup_ratio`: 0.1
- `max_length`: 512 (dynamic padding with DataCollatorWithPadding)
- `seed`: 42
- `loss`: BCEWithLogitsLoss with positive class weights

---

## 4. Precalculated Positive Class Weights

Calculated strictly from `train.jsonl` (26,739 rows) and clipped to `max_weight_clip = 10.0`:
Saved to [`training/complaint_classifier/reports/class_weights.json`](file:///c:/Users/Admin/Desktop/CCIP/training/complaint_classifier/reports/class_weights.json).

| Label | Train Count | Raw Weight | Clipped Weight (max 10.0) |
|---|---|---|---|
| `PHISHING` | 4,814 | 4.5544 | 4.5544 |
| `UPI_FRAUD` | 2,183 | 11.2487 | 10.0000 |
| `BANKING_FRAUD` | 2,974 | 7.9909 | 7.9909 |
| `CARD_FRAUD` | 1,171 | 21.8343 | 10.0000 |
| `INVESTMENT_SCAM` | 1,650 | 15.2055 | 10.0000 |
| `JOB_SCAM` | 1,453 | 17.4026 | 10.0000 |
| `LOAN_APP_FRAUD` | 1,594 | 15.7748 | 10.0000 |
| `DIGITAL_ARREST` | 2,547 | 9.4982 | 9.4982 |
| `IDENTITY_THEFT` | 1,494 | 16.8976 | 10.0000 |
| `ACCOUNT_TAKEOVER` | 1,104 | 23.2201 | 10.0000 |
| `SOCIAL_MEDIA_CRIME` | 2,374 | 10.2633 | 10.0000 |
| `ONLINE_SHOPPING_FRAUD` | 1,510 | 16.7079 | 10.0000 |
| `SEXTORTION` | 1,540 | 16.3630 | 10.0000 |
| `CYBERSTALKING` | 2,114 | 11.6485 | 10.0000 |
| `MALWARE_RANSOMWARE` | 1,104 | 23.2201 | 10.0000 |
| `CRYPTO_FRAUD` | 1,410 | 17.9638 | 10.0000 |
| `BUSINESS_EMAIL_COMPROMISE` | 1,325 | 19.1804 | 10.0000 |
| `OTHER` | 2,792 | 8.5770 | 8.5770 |

---

## 5. Provenance & Licensing Disclosure

In compliance with project guidelines:
- Public datasets whose licenses are unverified or labeled "Open / Research" (`Shade63`, `ysangam`, `sidddd625`, `anmolshrivastav`, `vnovaai`) are categorized as **`LICENSE_REVIEW_REQUIRED`**.
- This status allows model training and evaluation for validation, but commercial distribution requires formal upstream license audits.
- Existing backend trained models (`backend/ml_models/email_threat/`, `sms_spam/`, `url_phishing/`) remain strictly untouched.
