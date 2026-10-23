# CCIP Cybercrime Complaint Classifier - Dataset Audit Report (v1.1.0)

**Dataset Version:** `complaint-dataset-v1.1.0`  
**Parent Version:** `complaint-dataset-v1.0.0`  
**Generated Date:** 2026-09-09 16:49:01 UTC  
**Pipeline Version:** 1.1.0  
**Mapping Version:** 1.1.0  
**Random Seed:** 42  

---

## 1. Executive Summary

- **Total Processed Records:** 31,394 (v1.0.0 was 19,696)
- **Cybercrime Complaints (is_cybercrime=1):** 24,323 (77.48%)
- **Legitimate Controls (is_cybercrime=0, labels=[]):** 7,071 (22.52%)
- **Exact Duplicates Removed:** 16,635
- **Normalized Duplicates Removed:** 14
- **Near Duplicates Clustered:** 14,991
- **Unique Template Groups:** 16,391
- **Cross-Split Leakage Check:** **PASSED (Zero Overlaps)**

---

## 2. Weak Class Expansion: Before (v1.0.0) vs After (v1.1.0)

Target threshold: **1,000+ positive training examples** per important label.

| Label | v1.0.0 Train | v1.1.0 Train | Change | v1.1.0 Val | v1.1.0 Test | v1.1.0 Total | Target Met (>=1k) |
|---|---|---|---|---|---|---|---|
| **`PHISHING`** | 2,081 | **4,814** | +131.3% | 459 | 353 | 5,626 | **YES** (1k+) |
| **`UPI_FRAUD`** | 486 | **2,183** | +349.2% | 111 | 130 | 2,424 | **YES** (1k+) |
| **`BANKING_FRAUD`** | 2,021 | **2,974** | +47.2% | 368 | 298 | 3,640 | **YES** (1k+) |
| **`CARD_FRAUD`** | 110 | **1,171** | +964.5% | 105 | 26 | 1,302 | **YES** (1k+) |
| **`INVESTMENT_SCAM`** | 938 | **1,650** | +75.9% | 56 | 104 | 1,810 | **YES** (1k+) |
| **`JOB_SCAM`** | 271 | **1,453** | +436.2% | 64 | 100 | 1,617 | **YES** (1k+) |
| **`LOAN_APP_FRAUD`** | 135 | **1,594** | +1080.7% | 74 | 79 | 1,747 | **YES** (1k+) |
| **`DIGITAL_ARREST`** | 2,143 | **2,547** | +18.9% | 252 | 234 | 3,033 | **YES** (1k+) |
| **`IDENTITY_THEFT`** | 203 | **1,494** | +636.0% | 154 | 126 | 1,774 | **YES** (1k+) |
| **`ACCOUNT_TAKEOVER`** | 84 | **1,104** | +1214.3% | 61 | 81 | 1,246 | **YES** (1k+) |
| **`SOCIAL_MEDIA_CRIME`** | 45 | **2,374** | +5175.6% | 124 | 128 | 2,626 | **YES** (1k+) |
| **`ONLINE_SHOPPING_FRAUD`** | 145 | **1,510** | +941.4% | 68 | 51 | 1,629 | **YES** (1k+) |
| **`SEXTORTION`** | 86 | **1,540** | +1690.7% | 113 | 78 | 1,731 | **YES** (1k+) |
| **`CYBERSTALKING`** | 20 | **2,114** | +10470.0% | 101 | 117 | 2,332 | **YES** (1k+) |
| **`MALWARE_RANSOMWARE`** | 62 | **1,104** | +1680.6% | 82 | 88 | 1,274 | **YES** (1k+) |
| **`CRYPTO_FRAUD`** | 440 | **1,410** | +220.5% | 92 | 100 | 1,602 | **YES** (1k+) |
| **`BUSINESS_EMAIL_COMPROMISE`** | 11 | **1,325** | +11945.5% | 75 | 66 | 1,466 | **YES** (1k+) |
| **`OTHER`** | 3,226 | **2,792** | +-13.5% | 247 | 295 | 3,334 | **YES** (1k+) |

---

## 3. Split Distribution & Real/Synthetic Balance

| Split | Total Rows | Cybercrime | Legitimate | Real Count | Synthetic Count | Real Ratio | Synthetic Ratio |
|---|---|---|---|---|---|---|---|
| **Train (80%)** | 26,739 | 21,096 | 5,643 | 13,054 | 13,685 | 48.82% | 51.18% |
| **Validation (10%)** | 2,384 | 1,664 | 720 | 1,597 | 787 | **66.99%** | 33.01% |
| **Test (10%)** | 2,271 | 1,563 | 708 | 1,620 | 651 | **71.33%** | 28.67% |

*Note: Real records account for 71.3% of the test set and 67.0% of the validation set, ensuring that evaluation is anchored in authentic data without synthetic dominance.*

---

## 4. Source-Level Breakdown

| Source | Downloaded / Created | Accepted | Rejected | Final Unique | % Total |
|---|---|---|---|---|---|
| `Shade63/scam-classification-multiclass` | 14,000 | 14,000 | 0 | 14,000 | 44.59% |
| `ysangam/Indian_Cyber_Scam_PhoneCall_Hinglish_Dataset` | 10,000 | 10,000 | 0 | 743 | 2.37% |
| `sidddd625/adaption-fraud-and-cyber-safety` | 2,658 | 2,658 | 0 | 2,598 | 8.28% |
| `anmolshrivastav/scam-hum-india` | 2,272 | 2,271 | 1 | 2,256 | 7.19% |
| `vnovaai/INDIA_FRAUD_DETECTION_JSONL_V1` | 99 | 99 | 0 | 99 | 0.32% |
| `ccip_curated_corpus` | 19,015 | 19,015 | 0 | 11,698 | 37.26% |

---

## 5. Quality Review Queue Summary

- **Total Candidates Reviewed:** 127
- **Auto-Accepted (High Confidence):** 127
- **Needs Manual Review:** 0
- **Rejected:** 0

---

## 6. Readiness Verification

1. **Zero Data Leakage:** Group-based split check passed with 0 overlaps across train, validation, and test.
2. **Provenance Preserved:** Every record tracks `source`, `source_label`, `synthetic`, `source_split`, and `mapping_version`.
3. **Legitimate Negative Integrity:** Legitimate examples strictly have `is_cybercrime=0` and `labels=[]`. `OTHER` is never assigned to legitimate samples.
4. **Weak Classes Strengthened:** Substantial, verified gains across all 14 targeted underrepresented classes.
