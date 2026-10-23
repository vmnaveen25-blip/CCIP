# CCIP Complaint Classifier Training Summary

- Base model: `microsoft/deberta-v3-base`
- Dataset: complaint-dataset-v1.1.0
- Train / validation / test: 26739 / 2384 / 2271
- Labels: 18
- Best epoch: 4
- Best validation Macro F1 at 0.5: 0.968898
- Final validation Macro F1: 0.983974
- Final test Macro F1: 0.976723
- Final test Micro F1: 0.974599
- Real-test Macro F1: 0.813061
- Synthetic-test Macro F1: 0.963724
- Threshold calibration: validation split only
- License status: LICENSE_REVIEW_REQUIRED
