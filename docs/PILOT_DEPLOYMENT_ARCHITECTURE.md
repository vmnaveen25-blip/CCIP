# Pilot Deployment Architecture: Prototype to Enterprise Transition

**Project:** Citizen Cybercrime Intelligence & Reporting Platform (CCIP) / Astraea Enclave  
**Document Purpose:** Infrastructure Topology & Production Transition Blueprint  
**Status:** Advanced Prototype / Pilot Preparation  

---

## 1. Prototype vs Pilot Production Topology

```
CURRENT PROTOTYPE BASELINE                     RECOMMENDED PILOT PRODUCTION ARCHITECTURE
(Single Host / Enclave Machine)                (High-Availability Enclave Cluster)

+-----------------------------+                +-----------------------------------------------+
|  Vite Dev / Dist Static Web |                |  Reverse Proxy & WAF (Nginx / Traefik)        |
+-----------------------------+                |  - TLS 1.3 Termination, HSTS, Rate Limiting   |
              │                                +-----------------------------------------------+
              ▼                                                        │
+-----------------------------+                                        ▼
|  FastAPI (Single Process)   |                +-----------------------------------------------+
|  - Uvicorn on localhost     |                |  Application Gateway & Multi-Worker FastAPI   |
|  - SQLite WAL Database      |                |  - Gunicorn / Uvicorn cluster (4-8 workers)   |
|  - Local CPU Model Loader   |                |  - Decoupled Stateless API nodes              |
|  - Local File Upload Store  |                +-----------------------------------------------+
+-----------------------------+                         │               │               │
                                                        ▼               ▼               ▼
                                               +----------------+ +-----------+ +---------------+
                                               | PostgreSQL HA  | | Redis     | | Async Workers |
                                               | Primary + Repl | | Cache/MQ  | | Celery/TaskQ  |
                                               +----------------+ +-----------+ +---------------+
                                                                        │               │
                                                                        ▼               ▼
                                                                +-------------------------------+
                                                                | Local Model Inference Worker  |
                                                                | - Dedicated GPU / Optimized   |
                                                                | - 11 Local Enclave Models     |
                                                                | - Zero External Cloud Egress  |
                                                                +-------------------------------+
                                                                                │
                                                                                ▼
                                                                +-------------------------------+
                                                                | Private Object Storage        |
                                                                | - MinIO / S3-Compatible Vault |
                                                                | - Cryptographic SHA-256 Seals |
                                                                +-------------------------------+
```

---

## 2. Infrastructure Comparison Matrix

| Component Layer | Current Prototype Implementation | Pilot Target Implementation | Rationale for Production Migration |
|---|---|---|---|
| **Web Presentation** | Static HTML/JS bundled by Vite, served locally | Nginx reverse proxy serving minified static bundle with gzip/brotli compression | High-concurrency static asset delivery with HTTP/2 and HTTP/3 support. |
| **API Application** | Single Uvicorn asynchronous process | Multi-worker Gunicorn process managing Uvicorn workers behind a load balancer | Horizontal scalability, automated worker restart, zero-downtime rolling deploys. |
| **Relational Database** | SQLite (WAL mode, single-file on disk) | PostgreSQL 16+ with Primary-Standby replication and automated failover | Multi-user concurrency, row-level locking, point-in-time recovery (PITR). |
| **Vector Storage** | In-memory embedding matrix with Python dot product | `pgvector` extension integrated directly inside PostgreSQL | Scalable vector search across hundreds of thousands of cases using HNSW indexing. |
| **Evidence Storage** | Local filesystem directory (`/evidence`) | S3-compliant Private Object Store (MinIO on-premise cluster) | Scalable petabyte-level evidence capacity, object immutability, automated encryption. |
| **Task Execution** | In-process asynchronous coroutines | Distributed task queue (Celery or ARQ backed by Redis) | Asynchronous execution of heavy transformer pipelines without blocking web requests. |
| **Model Serving** | Python PyTorch on local CPU | Dedicated GPU inference worker (NVIDIA Triton / TensorRT-LLM / TorchScript) | 5x–10x reduction in inference latency under concurrent multi-user load. |
| **Security & Logging** | Local rotating file logs | Centralized SIEM forwarding (Syslog / Elastic / OpenSearch / Grafana Loki) | Departmental compliance, tamper-evident external log retention, automated intrusion alerts. |

---

## 3. Hosting & Deployment Options for Government / Law Enforcement

### Option A: Air-Gapped On-Premises Rack Appliance (Recommended for Cyber Cells)
- **Topology:** Single 2U/4U rack server installed in a secure departmental server room.
- **Hardware Profile:** Dual AMD EPYC / Intel Xeon processors, 128GB ECC RAM, 1x NVIDIA L40S or RTX 6000 Ada GPU, NVMe RAID-10 storage.
- **Network Posture:** Physically disconnected from the public internet (air-gapped); accessible exclusively via departmental LAN or secure VPN.

### Option B: Sovereign Government Cloud (MeitY / NIC / AWS GovCloud)
- **Topology:** Virtual Private Cloud (VPC) hosted within a sovereign, certified government data center.
- **Network Posture:** Isolated private subnets, bastion hosts, zero outbound internet routes; citizen portal exposed via reverse proxy protected by Government WAF.

### Option C: Enterprise Security Operations Center (SOC) Appliance
- **Topology:** Containerized deployment using Docker Compose or Kubernetes (K8s / OpenShift) inside corporate firewall boundaries.
- **Integration:** Webhook hooks connecting to enterprise ticketing (ServiceNow) and identity management (LDAP / Active Directory / Okta).
