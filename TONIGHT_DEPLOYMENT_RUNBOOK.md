# CCIP — Tonight's Local Prototype Deployment Runbook

## Scope
This kit is for a **local prototype on the developer's machine**, with Docker Compose and localhost-only port bindings. It is not a public-production deployment and should use synthetic data only. The kit cannot deploy to your computer or cloud account by itself; run these steps in your local repository.

## Why this kit exists
The inspected repository's `frontend/Dockerfile` builds an Nginx static site but does not install an Nginx configuration to proxy `/api/v1` to FastAPI. The frontend uses the relative API base `/api/v1`, so without a proxy its browser requests may be answered by the static SPA instead of the backend. This kit adds a prototype Dockerfile and proxy config, plus Docker ignore rules to avoid copying local `.env`, SQLite, storage and runtime files into images.

## 0. Before doing anything
1. Preserve `MODEL TESTING` reports, logs, the Phase 2 CSV/JSON and the current local database.
2. Check `git status` and commit the Phase 2 fixes on a separate branch only after running tests. The publicly inspected GitHub `main` still pointed to `f260be0a5f19b910ddf2ec9396134f8cbdcd9f37` during review; do not assume local uncommitted fixes are in the remote repository.
3. Do not use citizen PII or a production database. Do not expose the seeded development staff accounts to the internet.

## 1. Copy kit files into your repository
From this kit, copy:
- `docker-compose.prototype.yml` to repository root
- `frontend/Dockerfile.prototype` to `frontend/Dockerfile.prototype`
- `frontend/nginx.prototype.conf` to `frontend/nginx.prototype.conf`
- `frontend/.dockerignore` to `frontend/.dockerignore`
- `backend/.dockerignore` to `backend/.dockerignore`

Review `ROOT_DOCKERIGNORE.txt` and create a root `.dockerignore` only if you build an image with repository root as the context. Do not replace the existing production compose without reviewing it.

## 2. Make a new local environment file
First preserve any existing `.env`; do not overwrite it. Copy `prepare-prototype-env.ps1` to the repository root and run it from PowerShell there. It creates `.env.prototype` only if that file does not already exist, using separate cryptographically random secrets for Postgres, MinIO and both JWT keys. Alternatively, copy `.env.prototype.example` to `.env.prototype` and fill in different random values. The runbook commands use `--env-file .env.prototype` so your existing `.env` is left alone. Never commit `.env.prototype`.

## 3. Validate Compose before build
```powershell
docker compose --env-file .env.prototype -f docker-compose.prototype.yml config
```
If Docker is not installed or the command fails, stop and fix that before launch. Do not proceed by improvising around missing environment values.

## 4. Build and start
```powershell
docker compose --env-file .env.prototype -f docker-compose.prototype.yml up --build -d
```
The first image build and ClamAV database initialization may take some time. Check status and logs:

```powershell
docker compose --env-file .env.prototype -f docker-compose.prototype.yml ps
docker compose --env-file .env.prototype -f docker-compose.prototype.yml logs --tail 150 backend
docker compose --env-file .env.prototype -f docker-compose.prototype.yml logs --tail 100 frontend
docker compose --env-file .env.prototype -f docker-compose.prototype.yml logs --tail 100 clamav
```

## 5. Health and UI smoke tests
```powershell
Invoke-WebRequest http://127.0.0.1:8000/health
Invoke-WebRequest http://127.0.0.1:5173/
Invoke-WebRequest http://127.0.0.1:5173/api/v1/health
```
The last request may not be a registered API path depending on router registration; use the actual health route shown by `backend/app/main.py`. The key test is that `/api/v1/...` calls are proxied to FastAPI, not served as `index.html`.

Open `http://127.0.0.1:5173` and check: login/registration, authentication persistence, a synthetic complaint flow, evidence upload with synthetic file, evidence hash metadata, malware scan outcome, dashboard loading, and logout. Mark any untested capability as NOT VERIFIED.

## 6. Accounts and seeded demo data
A newly created Postgres database has no users merely because tables exist. The repository's `backend/scripts/seed.py` creates canned demo accounts and synthetic records with credentials embedded in source. Do **not** expose these known accounts to the internet. If you choose to seed for a local-only demo, do so only after confirming the deployment is bound to localhost and contains no real citizen data. For any remotely accessible prototype, replace seeded passwords with unique secrets and provision a dedicated test account; protect the entire site behind an access-control layer and HTTPS before sharing the URL.

## 7. Important prototype limitations
- The repository report says several neural weight files are absent. The UI must disclose rule-based fallback/unavailable status honestly.
- Ollama may remain offline unless configured and running; the app's deterministic assistant is not equivalent to a functioning LLM.
- ClamAV readiness is separate from whether the app's upload route uses the live daemon. Verify the actual scan response and logs before claiming live malware scanning.
- The Compose file uses a moving MinIO tag; pin an approved image tag before a longer-lived deployment.
- This kit does not add TLS, backups, monitoring, production secret management or public ingress.
- Do not expose ports 5173, 8000, 5432, 6379, 9000, 9001 or 3310 directly to the internet. Ports in this file bind to `127.0.0.1`.

## 8. Stop / rollback
Stop services without deleting volumes:
```powershell
docker compose --env-file .env.prototype -f docker-compose.prototype.yml down
```
Do not use `down -v` unless you intentionally want to delete the prototype's database and stored evidence.

## Release claim
Only call this a **locally deployed prototype** after the UI and backend smoke tests above pass. It is not cleared for handling real cases or public production. Public deployment needs its own HTTPS/access-control review, corrected remote commit containing the Phase 2 fixes, seeded-account remediation, CI-green evidence, backups and tested evidence authorization.
