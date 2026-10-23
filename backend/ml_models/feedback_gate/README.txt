CCIP / Astraea Enclave Feedback Reliability Gate v1

Purpose: controlled continual-learning candidate selection.

Outputs:
REJECT
REQUIRES_REVIEW
APPROVE_CANDIDATE

APPROVE_CANDIDATE DOES NOT trigger automatic retraining.
Deterministic governance gates must remain authoritative.
Human approval is required before adding samples to a learning queue.

Deploy feedback_gate/ under backend/ml_models/.