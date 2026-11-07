# CCIP – API Inventory & Endpoint Catalog
## Complete Specification of RESTful Endpoints, Auth Guards & Schemas

**API Base URL:** `/api/v1`  
**Total Routers:** 28  
**Authentication Scheme:** HTTP Bearer (JWT) / Session Cookies / Ephemeral Session Tokens

---

### 1. Authentication & Session APIs (`/api/v1/auth`)

| Method | Endpoint | Summary | Guards / Depends | Request Model | Response Model | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Email/password authentication | Rate Limiter | `LoginRequest` | `TokenResponse` | **Verified** |
| `POST` | `/auth/register` | New citizen registration | Rate Limiter | `RegisterRequest` | `UserResponse` | **Verified** |
| `POST` | `/auth/refresh` | Refresh expired access token | Refresh Token | `RefreshTokenRequest` | `TokenResponse` | **Verified** |
| `POST` | `/auth/logout` | Revoke session & blacklist token | `get_current_user` | None | `SuccessMessage` | **Verified** |
| `POST` | `/auth/google` | Google OAuth2 token exchange | None | `GoogleAuthRequest` | `TokenResponse` | **Verified** |
| `POST` | `/auth/otp/send` | Request Email / SMS OTP | Rate Limiter | `SendOTPRequest` | `OTPSentResponse` | **Verified** |
| `POST` | `/auth/otp/verify` | Verify single-use OTP | Rate Limiter | `VerifyOTPRequest` | `TokenResponse` | **Verified** |
| `POST` | `/auth/password/forgot` | Issue secure password reset token | Rate Limiter | `ForgotPasswordRequest`| `SuccessMessage` | **Verified** |
| `POST` | `/auth/password/reset` | Consume reset token & update password | Token Guard | `ResetPasswordRequest` | `SuccessMessage` | **Verified** |

---

### 2. Public AI Citizen Assistant APIs (`/api/v1/public-chat`)

| Method | Endpoint | Summary | Guards / Depends | Request Model | Response Model | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/public-chat/session` | Create anonymous chat session (24h TTL)| Client IP / Rate Limit| None | `PublicChatSessionResponse`| **Verified** |
| `POST` | `/public-chat/message` | Submit query, run RAG, return answer | Valid Session Token | `PublicChatMessageRequest` | `PublicChatMessageResponse`| **Verified** |
| `DELETE`| `/public-chat/session/{id}` | Terminate session & purge context | Valid Session Token | None | `SuccessMessage` | **Verified** |
| `GET`  | `/public-chat/health` | Public assistant health & index status | None | None | `PublicChatHealthResponse` | **Verified** |

---

### 3. Admin Knowledge Materials RAG APIs (`/api/v1/admin/knowledge-materials`)

| Method | Endpoint | Summary | Guards / Depends | Request Model | Response Model | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET`  | `/admin/knowledge-materials` | Paginated list of RAG materials | `require_admin` | Query params | `KnowledgeMaterialListResponse` | **Verified** |
| `POST` | `/admin/knowledge-materials` | Upload PDF/DOCX/TXT and trigger vectorization | `require_admin` | Multipart Form | `KnowledgeMaterialUploadResponse`| **Verified** |
| `GET`  | `/admin/knowledge-materials/{id}` | Get metadata, chunks count, status | `require_admin` | Path param | `KnowledgeMaterialDetailResponse` | **Verified** |
| `GET`  | `/admin/knowledge-materials/{id}/download` | Stream download raw document | `require_admin` | Path param | File Streaming | **Verified** |
| `DELETE`| `/admin/knowledge-materials/{id}` | Purge raw file & cascade delete vector chunks | `require_admin` | Path param | `SuccessMessage` | **Verified** |
| `PATCH`| `/admin/knowledge-materials/{id}/chatbot-status` | Toggle availability for RAG queries | `require_admin` | `ChatbotStatusUpdate` | `KnowledgeMaterialResponse` | **Verified** |

---

### 4. Citizen Complaint & Tracking APIs (`/api/v1/complaints`)

| Method | Endpoint | Summary | Guards / Depends | Request Model | Response Model | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/complaints` | File new cybercrime incident | `get_optional_current_user` | `ComplaintCreateRequest` | `ComplaintResponse` | **Verified** |
| `GET`  | `/complaints` | List authenticated user's complaints | `get_current_user` | Query params | `List[ComplaintResponse]` | **Verified** |
| `GET`  | `/complaints/{id}` | Retrieve complaint by ID or Ref # | `get_optional_current_user` | Path param | `ComplaintDetailResponse` | **Verified** |
| `GET`  | `/complaints/{id}/timeline` | Get cryptographic status history | `get_optional_current_user` | Path param | `TimelineResponse` | **Verified** |

---

### 5. Digital Evidence Vault APIs (`/api/v1/evidence`)

| Method | Endpoint | Summary | Guards / Depends | Request Model | Response Model | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/evidence/upload` | Upload evidence with SHA-256 seal | Auth or Tracking Token | Multipart Form | `EvidenceUploadResponse` | **Verified** |
| `GET`  | `/evidence` | List evidence filtered by complaint | `get_current_user` | Query params | `List[EvidenceResponse]` | **Verified** |
| `GET`  | `/evidence/{id}` | Retrieve evidence metadata and hash | `get_current_user` | Path param | `EvidenceResponse` | **Verified** |
| `GET`  | `/evidence/{id}/download` | Stream download verified evidence | `get_current_user` | Path param | File Streaming | **Verified** |
| `GET`  | `/evidence/{id}/processing` | Get OCR, entities & analysis results | `get_current_user` | Path param | `DocumentProcessingResponse` | **Verified** |

---

### 6. SOC Specialist & Investigation APIs (`/api/v1/cases`, `/api/v1/specialist`)

| Method | Endpoint | Summary | Guards / Depends | Request Model | Response Model | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET`  | `/cases` | List all investigation cases | `require_specialist` | Query params | `CaseListResponse` | **Verified** |
| `GET`  | `/cases/{id}` | Detailed case dossier & entity graph | `require_specialist` | Path param | `CaseDetailResponse` | **Verified** |
| `PATCH`| `/cases/{id}/status` | Update case status with audit trail | `require_specialist` | `StatusUpdateRequest` | `CaseResponse` | **Verified** |
| `POST` | `/cases/{id}/notes` | Append investigator observation | `require_specialist` | `NoteCreateRequest` | `NoteResponse` | **Verified** |
| `GET`  | `/specialist/triage/queue` | High-urgency pending triage queue | `require_specialist` | Query params | `TriageQueueResponse` | **Verified** |
| `POST` | `/specialist/triage/{id}/score` | Run AI triage scoring | `require_specialist` | Path param | `TriageScoreResponse` | **Verified** |

---

### 7. AI/ML Detection & MLOps APIs (`/api/v1/ai-verification`, `/api/v1/mlops`)

| Method | Endpoint | Summary | Guards / Depends | Request Model | Response Model | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/ai-verification/url` | Evaluate zero-hour phishing URL | `get_current_user` | `URLVerifyRequest` | `URLVerifyResponse` | **Verified** |
| `POST` | `/ai-verification/sms` | Analyze SMS for smishing threats | `get_current_user` | `SMSVerifyRequest` | `SMSVerifyResponse` | **Verified** |
| `POST` | `/ai-verification/email` | Analyze email header and payload | `get_current_user` | `EmailVerifyRequest` | `EmailVerifyResponse` | **Verified** |
| `POST` | `/ai-verification/batch` | Batch CSV evaluation of threats | `get_current_user` | Multipart Form | `BatchVerifyResponse` | **Verified** |
| `GET`  | `/mlops/models` | List all model registry statuses | `require_ai_lead` | None | `List[ModelStatusResponse]` | **Verified** |
| `GET`  | `/mlops/drift` | Get data & concept drift metrics | `require_ai_lead` | None | `DriftMetricsResponse` | **Verified** |
| `POST` | `/mlops/models/{id}/rollback` | Revert model to previous checkpoint | `require_ai_lead` | Path param | `RollbackResponse` | **Correction Required** |

