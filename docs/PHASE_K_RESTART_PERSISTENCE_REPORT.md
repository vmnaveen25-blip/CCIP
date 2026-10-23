# CCIP / Astraea Enclave — Phase K Restart Persistence Report

**Document Version:** 1.0.0  
**Phase:** Phase K — End-to-End Intelligence Hardening, Real Prototype Validation & Demo Readiness  
**Target:** Cold Restart Durability of Intelligence Artifacts and Human Review Decisions  
**Test Suite:** `backend/tests/test_restart_persistence.py`  
**Date:** 2026-09-12  

---

## 1. Executive Summary

A rigorous persistence verification test was executed to confirm that all multi-model intelligence findings, structured indicators, relation graphs, cross-case correlations, and investigator review decisions survive a complete backend shutdown and cold restart.

### Key Finding
**100% of intelligence artifacts remained fully intact upon restart.** No data was lost, corrupt, or dropped as a result of model memory unloads or process termination.

---

## 2. Test Execution Methodology

The test was conducted using `backend/tests/test_restart_persistence.py` with the following procedure:

1. **Pre-Shutdown Phase (Active Database Engine 1):**
   - Created a realistic complaint (`CYBER-PERSIST-001`) with financial loss of Rs 450,000.
   - Initialized linked Case (`CASE-PERSIST-001`).
   - Persisted extracted CyberEntities (`UPI_ID`: `fraudster@upi`, `BANK_NAME`: `State Bank of India`).
   - Persisted extracted `CyberEntityRelation` (`ASSOCIATED_WITH_BANK`, confidence `0.91`).
   - Persisted `InvestigationFinding` from multi-stage intelligence refresh.
   - Persisted `CaseCorrelation` between cases with investigator verdict `CONFIRMED_RELEVANT`.
   - Persisted `EvidenceGraphNode` and `EvidenceGraphEdge` with status `VERIFIED`.
   - Persisted `LearningCandidate` with decision `APPROVE_CANDIDATE`.
   - Committed transaction and flushed to on-disk database.

2. **Shutdown Simulation:**
   - Terminated active database engine (`engine_1.dispose()`).
   - Closed all active sessions and thread pools.
   - Model memory evicted from RAM.

3. **Cold Restart Phase (Fresh Database Engine 2 & Session Factory):**
   - Initialized completely new SQLAlchemy async engine pointing to the persistent database file.
   - Re-queried all tables from scratch without pre-loaded caches.

---

## 3. Observed Verification Results Table

| Subsystem / Artifact | Pre-Shutdown State | Post-Restart State | Data Integrity Status | Verification Evidence |
|---|---|---|---|---|
| **Complaint Record** | `CYBER-PERSIST-001`, loss 450,000 | `CYBER-PERSIST-001`, loss 450,000 | **100% MATCH** | Exact match on reference number, citizen email, loss |
| **Case Record** | `CASE-PERSIST-001`, `UNDER_INVESTIGATION` | `CASE-PERSIST-001`, `UNDER_INVESTIGATION` | **100% MATCH** | Status and complaint linkage preserved |
| **Cyber Entities** | 2 entities (`UPI_ID`, `BANK_NAME`) | 2 entities (`UPI_ID`, `BANK_NAME`) | **100% MATCH** | Normalization, confidence, and provenance intact |
| **Cyber Relations** | `ASSOCIATED_WITH_BANK`, conf 0.91 | `ASSOCIATED_WITH_BANK`, conf 0.91 | **100% MATCH** | Source and target foreign keys intact |
| **Investigation Findings** | Multi-stage refresh summary | Multi-stage refresh summary | **100% MATCH** | Finding text and confidence intact |
| **Case Correlation** | `STRONGLY_RELATED`, `CONFIRMED_RELEVANT` | `STRONGLY_RELATED`, `CONFIRMED_RELEVANT` | **100% MATCH** | Investigator review status preserved |
| **Evidence Graph Nodes** | `UPI_ID`: `fraudster@upi` | `UPI_ID`: `fraudster@upi` | **100% MATCH** | Node ID and canonical value preserved |
| **Evidence Graph Edges** | `SELF_LOOP`, `VERIFIED` | `SELF_LOOP`, `VERIFIED` | **100% MATCH** | Review status remains `VERIFIED` |
| **Learning Candidates** | `APPROVE_CANDIDATE`, `PENDING` | `APPROVE_CANDIDATE`, `PENDING` | **100% MATCH** | Gate source `NEURAL_GATE` intact |

---

## 4. Architectural Analysis & Inferences

1. **Storage Decoupling:**
   Intelligence extraction results are immediately written to relational database tables rather than held transiently in model memory. This ensures that models can be unloaded, swapped, or restarted on CPU without risking investigator data loss.

2. **Investigator Authority Preservation:**
   Because investigator decisions (`CONFIRMED_RELEVANT`, `DISMISSED`, `VERIFIED`) are persisted directly to the relational store, subsequent automated intelligence refreshes will not overwrite human determinations.

3. **Production Recommendation:**
   In containerized or Kubernetes environments, ensure persistent volume mounts (`PVC`) for SQLite storage (`backend/data/` or PostgreSQL backend) and the evidence vault (`backend/storage/`).
