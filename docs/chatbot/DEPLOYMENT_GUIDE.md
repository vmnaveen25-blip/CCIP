# CCIP AI Assistant & Knowledge Materials: Production Deployment Guide

**Document ID:** CCIP-DOC-CB-011  
**Version:** 1.0.0 (Production)  
**Target Audience:** DevOps Engineers, Platform Infrastructure Leads, System Administrators  

---

## 1. Environment Prerequisites

- **Operating System:** Linux (Ubuntu 22.04 LTS / RHEL 9) or Windows Server 2022
- **Python Runtime:** Python 3.12 (64-bit) with `pip` and virtual environment support
- **Node.js Runtime:** Node.js 20.x LTS or 22.x LTS with `npm`
- **Database Engine:** SQLite 3.45+ (with Write-Ahead Logging) or PostgreSQL 15+
- **Hardware Sizing:**
  - *Minimum:* 4 CPU Cores, 8 GB RAM, 20 GB NVMe Storage
  - *Recommended Production:* 8 CPU Cores, 16 GB RAM, 100 GB NVMe Storage

---

## 2. Directory Structure & Permissions

Ensure the following directory structure is present and writable by the service account (`ccip-service`):

```powershell
c:\CCIP-main\CCIP-main\
├── backend\
│   ├── app\
│   ├── storage\
│   │   └── knowledge_materials\   <-- Private Document Vault (Permissions: 0700 / User Only)
│   ├── ccip.db                    <-- SQLite Sovereign DB (WAL Mode)
│   └── venv\
└── frontend\
    ├── dist\                      <-- Built Static Web Assets
    └── src\
```

---

## 3. Environment Variables Configuration

Create or update `.env` in `backend/`:

```ini
# Enclave Core Configuration
ENVIRONMENT=production
DEBUG=false
ENCLAVE_SECRET_KEY=generate_a_cryptographically_secure_random_64_byte_key
DATABASE_URL=sqlite+aiosqlite:///C:/CCIP-main/CCIP-main/backend/ccip.db

# Knowledge Materials & Storage
KNOWLEDGE_MATERIALS_VAULT_PATH=C:/CCIP-main/CCIP-main/backend/storage/knowledge_materials
MAX_UPLOAD_SIZE_MB=25

# RAG & AI Configuration
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
EMBEDDING_DEVICE=cpu
RAG_SIMILARITY_THRESHOLD=0.35
RAG_TOP_K=4

# Rate Limiting & Anonymous Sessions
CHATBOT_RATE_LIMIT_PER_MINUTE=30
CHATBOT_SESSION_TTL_HOURS=24
```

---

## 4. Production Service Deployment

### 4.1 Backend Service (Uvicorn Systemd / Process Management)
To launch the backend in production mode with 4 asynchronous workers:
```bash
uvicorn app.main:app \
  --host 127.0.0.1 \
  --port 8000 \
  --workers 4 \
  --proxy-headers \
  --forwarded-allow-ips='*' \
  --no-access-log
```

*(On Windows, run using Windows Service Wrapper / NSSM with automatic restart on failure).*

### 4.2 Frontend Web Production Server (Nginx)
Build the frontend assets:
```powershell
cd CCIP-main\frontend
npm run build
```

Configure Nginx reverse proxy block:
```nginx
server {
    listen 443 ssl http2;
    server_name ccip.gov.in;

    ssl_certificate /etc/ssl/certs/ccip_cert.pem;
    ssl_certificate_key /etc/ssl/private/ccip_key.pem;

    root /var/www/ccip/frontend/dist;
    index index.html;

    # Static UI Files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Public Chat & Knowledge Admin API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Backup & Disaster Recovery

### 5.1 SQLite Database Hot Backup
Because SQLite operates in `WAL` mode, hot online backups can be executed without stopping the application:
```powershell
sqlite3 c:\CCIP-main\CCIP-main\backend\ccip.db ".backup 'C:\backups\ccip_db_backup.db'"
```

### 5.2 Document Vault Synchronization
Synchronize `storage/knowledge_materials/` to an encrypted cold backup repository daily:
```powershell
robocopy "C:\CCIP-main\CCIP-main\backend\storage\knowledge_materials" "C:\backups\knowledge_materials" /MIR /E
```

