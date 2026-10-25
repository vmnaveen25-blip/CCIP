import pytest
import sys
import os

os.chdir(r"c:\CCIP-main\CCIP-main\backend")

class NodeCollector:
    def __init__(self):
        self.nodes = []

    def pytest_collection_modifyitems(self, session, config, items):
        for item in items:
            self.nodes.append(item.nodeid)

suite_files = {
    "chat": ["tests/test_investigation_chat.py"],
    "core": [
        "tests/test_auth.py",
        "tests/test_complaints.py",
        "tests/test_workflow_lifecycle.py",
        "tests/test_security_audit_remediation.py",
        "tests/test_e2e_complete_pass.py",
        "tests/test_phase_k_e2e.py",
        "tests/test_production_hardening.py",
    ],
    "degraded_and_admin": [
        "tests/test_model_degraded_modes.py",
        "tests/test_multi_model_adapters.py",
        "tests/test_admin_rbac.py",
    ]
}

results = {}

for suite_name, files in suite_files.items():
    collector = NodeCollector()
    args = ["--collect-only", "-q"] + files
    ret = pytest.main(args, plugins=[collector])
    results[suite_name] = collector.nodes
    print(f"Suite '{suite_name}': {len(collector.nodes)} test nodes collected.")

# Check overlap
all_nodes = []
for s, nodes in results.items():
    for n in nodes:
        all_nodes.append((s, n))

print(f"\nTotal collected across all 3 suites: {len(all_nodes)}")
unique_nodes = set(n for s, n in all_nodes)
print(f"Total unique test node IDs: {len(unique_nodes)}")

# Print detailed listing
for s, nodes in results.items():
    print(f"\n=== Suite: {s} ({len(nodes)} tests) ===")
    for n in nodes:
        print(f"  {n}")
