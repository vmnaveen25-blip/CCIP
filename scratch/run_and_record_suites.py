import os
import sys
import subprocess
import shutil

backend_dir = os.path.abspath("backend")
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SYNC_DATABASE_URL"] = "sqlite:///:memory:"
os.environ["PYTHONPATH"] = backend_dir
os.environ["PYTHONUNBUFFERED"] = "1"

python_exe = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
test_results_dir = os.path.abspath("test-results")
os.makedirs(test_results_dir, exist_ok=True)

# 1. Run Alembic migration check
print("\n================ Recording Alembic Migration ================")
alembic_log = os.path.join(test_results_dir, "alembic_migration.log")
alembic_res = subprocess.run(
    [python_exe, "-m", "alembic", "current"],
    cwd=backend_dir,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
)
with open(alembic_log, "w", encoding="utf-8") as f:
    f.write("=== Alembic Current Head Check ===\n")
    f.write(alembic_res.stdout)
print("Alembic current:", alembic_res.stdout.strip())

suites = [
    {
        "name": "chat",
        "tests": ["tests/test_investigation_chat.py"],
        "xml": os.path.join(test_results_dir, "pytest_chat_suite.xml"),
        "log": os.path.join(test_results_dir, "pytest_chat_suite.log"),
    },
    {
        "name": "assistant",
        "tests": ["tests/test_ai_assistant.py"],
        "xml": os.path.join(test_results_dir, "pytest_assistant_suite.xml"),
        "log": os.path.join(test_results_dir, "pytest_assistant_suite.log"),
    },
    {
        "name": "degraded_modes",
        "tests": [
            "tests/test_model_degraded_modes.py",
            "tests/test_multi_model_adapters.py",
            "tests/test_admin_rbac.py",
        ],
        "xml": os.path.join(test_results_dir, "pytest_degraded_suite.xml"),
        "log": os.path.join(test_results_dir, "pytest_degraded_suite.log"),
    },
    {
        "name": "core_hardening",
        "tests": [
            "tests/test_auth.py",
            "tests/test_complaints.py",
            "tests/test_workflow_lifecycle.py",
            "tests/test_security_audit_remediation.py",
            "tests/test_e2e_complete_pass.py",
            "tests/test_phase_k_e2e.py",
            "tests/test_production_hardening.py",
        ],
        "xml": os.path.join(test_results_dir, "pytest_core_suite.xml"),
        "log": os.path.join(test_results_dir, "pytest_core_suite.log"),
    },
]

for s in suites:
    print(f"\n================ Running Suite: {s['name']} ================")
    cmd = [
        python_exe, "-u", "-m", "pytest",
        *s["tests"],
        "-v",
        f"--junitxml={s['xml']}"
    ]
    proc = subprocess.run(cmd, cwd=backend_dir, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    with open(s["log"], "w", encoding="utf-8") as f:
        f.write(proc.stdout)
    print(f"Suite {s['name']} exit code: {proc.returncode}")
    # Print summary line (last 3 lines)
    lines = [l for l in proc.stdout.strip().splitlines() if l.strip()]
    if lines:
        print("\n".join(lines[-3:]))
    if proc.returncode != 0:
        print(f"FAILED: Suite {s['name']} failed with code {proc.returncode}")
        sys.exit(proc.returncode)

print("\n================ All Test Suites Recorded Successfully ================")
