# CCIP – Complete Dependency Inventory & Licensing Audit
## Software Bill of Materials (SBOM) & Third-Party Library Governance

**Auditor:** DevSecOps Engineer & Compliance Lead  
**Standards:** CycloneDX SBOM Specification, Open Source Licensing (MIT, Apache 2.0, BSD)  

---

### 1. Frontend Dependencies (`frontend/package.json`)

| Package Name | Specified Version | Resolved Version | License | Security Status | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `react` | `^18.3.1` | 18.3.1 | MIT | Clean | Core UI component lifecycle |
| `react-dom` | `^18.3.1` | 18.3.1 | MIT | Clean | DOM rendering engine |
| `vite` | `^6.0.5` | 6.4.3 | MIT | Clean | High-speed ESM development & build server |
| `tailwindcss` | `^3.4.17` | 3.4.17 | MIT | Clean | Utility-first CSS styling engine |
| `lucide-react` | `^0.469.0` | 0.469.0 | ISC | Clean | Cyber & administrative SVG icon set |
| `recharts` | `^2.15.0` | 2.15.0 | MIT | Clean | SOC & citizen analytics data visualizations |
| `react-force-graph-3d` | `^1.29.1` | 1.29.1 | MIT | Clean | 3D Cross-case IOC correlation graph |
| `three` | `^0.186.0` | 0.186.0 | MIT | Clean | WebGL 3D rendering context |
| `three-spritetext` | `^1.10.0` | 1.10.0 | MIT | Clean | Text billboard labels in 3D graphs |
| `dompurify` | `^3.4.15` | 3.4.15 | Apache-2.0 / MPL-2.0 | Clean | Client-side XSS prevention & HTML sanitizer |
| `marked` | `^18.0.12` | 18.0.12 | MIT | Clean | Markdown parser for AI chat streaming |
| `clsx` / `tailwind-merge`| `^2.1.1` / `^2.6.0` | 2.1.1 / 2.6.0 | MIT | Clean | Conditional CSS class composition |
| `typescript` | `^5.7.2` | 5.7.2 | Apache-2.0 | Clean | Static type analysis |

---

### 2. Backend Dependencies (`backend/requirements.txt`)

| Package Name | Minimum Version | License | Security / Audit Status | Operational Role |
| :--- | :--- | :--- | :--- | :--- |
| `fastapi` | `>=0.115.0` | MIT | Clean | High-concurrency async REST API gateway |
| `uvicorn[standard]` | `>=0.32.0` | BSD-3-Clause | Clean | ASGI production server |
| `pydantic` | `>=2.10.0` | MIT | Clean | Request & response schema validation |
| `pydantic-settings` | `>=2.6.0` | MIT | Clean | Environment variable configuration loader |
| `sqlalchemy` | `>=2.0.36` | MIT | Clean | Unified ORM & relational query builder |
| `alembic` | `>=1.14.0` | MIT | Clean | Database schema migration engine |
| `aiosqlite` | `>=0.20.0` | MIT | Clean | Non-blocking async SQLite driver |
| `asyncpg` | `>=0.30.0` | Apache-2.0 | Clean | High-throughput async PostgreSQL driver |
| `argon2-cffi` | `>=23.1.0` | MIT | Clean | Memory-hard quantum-resistant password hashing |
| `pyjwt[crypto]` | `>=2.10.0` | MIT | Clean | Cryptographic JWT token signing & verification |
| `torch` | `>=2.0.0` | BSD-style | Clean | Deep learning tensor engine & embeddings |
| `transformers` | `>=4.40.0` | Apache-2.0 | Clean | Hugging Face model architectures (DeBERTa, BERT) |
| `xgboost` | `>=2.0.0` | Apache-2.0 | Clean | Gradient-boosted decision trees for URL phishing |
| `joblib` | `>=1.3.0` | BSD-3-Clause | Clean | High-efficiency scikit-learn model serialization |
| `pandas` | `>=2.0.0` | BSD-3-Clause | Clean | Data manipulation for batch threat datasets |
| `pypdf` | `>=5.0.0` | BSD-3-Clause | Clean | Digital PDF text extraction & RAG ingestion |
| `python-docx` | `>=1.1.0` | MIT | Clean | Word document parsing for knowledge base |
| `httpx` | `>=0.28.0` | BSD-3-Clause | Clean | Asynchronous HTTP client for external APIs |
| `pytest` | `>=8.3.0` | MIT | Clean | Test execution runner |
| `pytest-asyncio` | `>=0.24.0` | Apache-2.0 | Clean | Asynchronous test fixture orchestration |

---

### 3. Licensing & Legal Compliance Summary
- **No GPL/AGPL viral copyleft dependencies:** All packages utilize permissive commercial licenses (MIT, Apache 2.0, BSD-3-Clause, ISC).
- **Commercial Deployment Compatibility:** The technology stack can be packaged, distributed, and operated as a proprietary software product or enterprise cloud service without licensing encumbrances.

