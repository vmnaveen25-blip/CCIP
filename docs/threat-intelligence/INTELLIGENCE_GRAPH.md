# 3D INTELLIGENCE GRAPH TOPOLOGY & PROVENANCE SPECIFICATION

**System:** CCIP (Citizen Cybercrime Intelligence Platform)  
**Classification:** RESTRICTED  
**Document Ref:** CTI-GRAPH-006  

---

## 1. Overview & Single-Engine Architecture

To maintain high rendering performance and avoid bundle bloat, Stage 12 **reuses the existing Three.js WebGL graph visualization engine** (`CorrelationGraph3D.tsx`) without introducing redundant graph libraries.

The backend endpoint `GET /api/v1/threat-intel/graph` outputs a standardized JSON topology (`nodes` and `links`) compatible with force-directed 3D space layouts.

---

## 2. Supported Entities & Color Hierarchy

The graph supports 11 entity types, each assigned a distinctive forensic hex color code:

| Entity Type | Hex Color | Visual Designation | Semantic Role |
| :--- | :---: | :---: | :--- |
| **`INVESTIGATION`** | `#3B82F6` | Blue | Active case or FIR proceeding. |
| **`EVIDENCE`** | `#10B981` | Emerald | Acquired bitstream file or document. |
| **`IP_ADDRESS`** | `#EF4444` | Red | Public or private IP observable. |
| **`DOMAIN`** | `#F59E0B` | Amber | Fully qualified domain name or hostname. |
| **`URL`** | `#EC4899` | Pink | Full uniform resource locator. |
| **`FILE_HASH`** | `#8B5CF6` | Purple | MD5, SHA-1, or SHA-256 binary digest. |
| **`EMAIL`** | `#6366F1` | Indigo | Spear-phishing or communicator address. |
| **`WALLET`** | `#14B8A6` | Teal | Bitcoin, Ethereum, or Tron cryptocurrency address. |
| **`MALWARE_FAMILY`**| `#DC2626` | Dark Red | Recognized trojan, ransomware, or stealer cluster. |
| **`THREAT_CAMPAIGN`**| `#7C3AED` | Violet | Coordinated multi-target cyber operation. |
| **`INTELLIGENCE_SOURCE`**| `#64748B`| Slate | Originating enclave, feed, or sensor node. |

---

## 3. Link Provenance & Verification Semantics

Each edge in the graph represents an `IntelligenceRelationship` and exposes:
- **`relationship`:** One of 10 supported types (`OBSERVED_IN`, `REPORTED_BY`, `HOSTED_ON`, `RESOLVES_TO`, etc.).
- **`provenance`:** One of four origin classes:
  1. `INTERNAL_EVIDENCE`: Factually grounded in acquired case bitstreams (solid edge).
  2. `EXTERNAL_INTEL`: Provided by upstream CTI feeds (dashed edge).
  3. `AI_SUGGESTION`: Synthetically derived through vector embeddings or NER heuristics (amber glow).
  4. `HUMAN_CONFIRMED`: Verified by a qualified cyber investigator (cyan beacon).
- **`confidence`:** Numerical confidence score ($0.0 - 100.0$) modulating edge thickness.
- **`is_confirmed`:** Boolean flag reflecting senior investigator review.

---

## 4. Graph Topology JSON Structure

```json
{
  "total_nodes": 45,
  "total_links": 62,
  "nodes": [
    {
      "id": "CASE-2026-0842",
      "label": "CASE-2026-0842",
      "type": "INVESTIGATION",
      "provenance": "INTERNAL_EVIDENCE",
      "confidence": 98.0,
      "color": "#3B82F6"
    },
    {
      "id": "198[.]51[.]100[.]1",
      "label": "198[.]51[.]100[.]1",
      "type": "IP_ADDRESS",
      "provenance": "EXTERNAL_INTEL",
      "confidence": 88.0,
      "color": "#EF4444"
    }
  ],
  "links": [
    {
      "source": "CASE-2026-0842",
      "target": "198[.]51[.]100[.]1",
      "relationship": "OBSERVED_IN",
      "confidence": 88.0,
      "provenance": "INTERNAL_EVIDENCE",
      "is_confirmed": false
    }
  ]
}
```

---

## 5. Investigator Graph Controls in UI

The 3D canvas supports:
1. **Camera Orbit & Zoom:** Three.js `OrbitControls` with smooth damping.
2. **Entity Type Filtering:** Toggle checkboxes to isolate or highlight specific observables (e.g. show only Wallets and IPs).
3. **Confidence Threshold Slider:** Sliders to filter out links below a configurable confidence threshold.
4. **Source Attribution Inspector:** Clicking any node reveals its first seen timestamp, associated cases, and upstream provider attribution.
