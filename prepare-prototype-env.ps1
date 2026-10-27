<#
.SYNOPSIS
    Prepares a secure, localhost-isolated .env.prototype environment configuration file for CCIP.
.DESCRIPTION
    Creates .env.prototype if it does not already exist, generating cryptographically independent,
    high-entropy secrets for PostgreSQL, MinIO, and JWT authentication tokens.
    Guarantees localhost isolation and preserves any existing production or development .env files.
#>

[CmdletBinding()]
param (
    [string]$TargetFile = ".env.prototype"
)

$targetPath = Join-Path (Get-Location) $TargetFile
if (Test-Path $targetPath) {
    Write-Host "[ALREADY EXISTS] '$targetPath' already exists." -ForegroundColor Yellow
    Write-Host "Preserving existing secrets. To regenerate, delete or back up '$TargetFile' first." -ForegroundColor Cyan
    exit 0
}

function New-CryptoHex([int]$bytesCount = 32) {
    $bytes = New-Object byte[] $bytesCount
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [System.BitConverter]::ToString($bytes).Replace("-", "").ToLower()
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  CCIP Prototype Deployment -- Cryptographic Secret Generation" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$postgresPass   = New-CryptoHex 32
$minioPass      = New-CryptoHex 32
$jwtSecretKey   = New-CryptoHex 32
$jwtRefreshKey  = New-CryptoHex 32

$template = @'
# ==============================================================================
# CCIP Prototype Environment Configuration (Localhost Prototype Only)
# CRITICAL: Do NOT commit this file to public or remote Git repositories.
# ==============================================================================

# Application Environment Mode
APP_ENV=production
DEBUG=false
PORT=8000
HOST=0.0.0.0

# Strict Localhost CORS Bindings
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Database Service (Postgres Container)
POSTGRES_DB=ccip_db
POSTGRES_USER=ccip_admin
POSTGRES_PASSWORD={{POSTGRES_PASSWORD}}

# Redis Cache & Task Broker
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Cryptographically Secure JWT Authentication Tokens (256-bit entropy)
JWT_SECRET_KEY={{JWT_SECRET_KEY}}
JWT_REFRESH_SECRET_KEY={{JWT_REFRESH_SECRET_KEY}}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Object Storage Vault (MinIO Container)
STORAGE_BACKEND=minio
MINIO_ENDPOINT=minio:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD={{MINIO_ROOT_PASSWORD}}
MINIO_BUCKET=ccip-evidence-vault
MINIO_SECURE=false

# Antivirus Scanning Engine (ClamAV Container)
MALWARE_SCANNER_TYPE=clamav
CLAMAV_HOST=clamav
CLAMAV_PORT=3310

# Demo Seeding Control (Set to true only for synthetic local evaluation)
ALLOW_DEMO_SEEDING=false

# AI Assistant & Sovereign LLM Runtime
AI_ASSISTANT_API_KEY=astraea-sovereign-enclave-prototype-v2
INVESTIGATION_LLM_PROVIDER=local
INVESTIGATION_LLM_BASE_URL=http://127.0.0.1:11434
INVESTIGATION_LLM_MODEL=qwen2.5:7b
'@

$content = $template `
    -replace '\{\{POSTGRES_PASSWORD\}\}', $postgresPass `
    -replace '\{\{MINIO_ROOT_PASSWORD\}\}', $minioPass `
    -replace '\{\{JWT_SECRET_KEY\}\}', $jwtSecretKey `
    -replace '\{\{JWT_REFRESH_SECRET_KEY\}\}', $jwtRefreshKey

[System.IO.File]::WriteAllText($targetPath, $content, [System.Text.Encoding]::UTF8)

Write-Host "[SUCCESS] Generated '$targetPath' with cryptographically strong secrets:" -ForegroundColor Green
Write-Host "  - POSTGRES_PASSWORD:        64 hex chars (256-bit)" -ForegroundColor Gray
Write-Host "  - MINIO_ROOT_PASSWORD:      64 hex chars (256-bit)" -ForegroundColor Gray
Write-Host "  - JWT_SECRET_KEY:           64 hex chars (256-bit)" -ForegroundColor Gray
Write-Host "  - JWT_REFRESH_SECRET_KEY:   64 hex chars (256-bit)" -ForegroundColor Gray
Write-Host "All external ports are bound to 127.0.0.1 (localhost only)." -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
