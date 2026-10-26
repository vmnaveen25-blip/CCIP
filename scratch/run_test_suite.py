import os
import sys
import subprocess

backend_dir = os.path.abspath("backend")
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SYNC_DATABASE_URL"] = "sqlite:///:memory:"
os.environ["PYTHONPATH"] = backend_dir
os.environ["PYTHONUNBUFFERED"] = "1"

python_exe = os.path.join(backend_dir, "venv", "Scripts", "python.exe")

args = [python_exe, "-u", "-m", "pytest"] + sys.argv[1:]
print("Running command:", " ".join(args))

proc = subprocess.run(args, cwd=backend_dir, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

out_file = os.path.join("scratch", "pytest_output.txt")
with open(out_file, "w", encoding="utf-8") as f:
    f.write(proc.stdout)

print(proc.stdout)
sys.exit(proc.returncode)
