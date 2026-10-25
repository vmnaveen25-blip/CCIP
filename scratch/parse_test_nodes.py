import ast
import os

tests_dir = r"c:\CCIP-main\CCIP-main\backend\tests"

def extract_tests_from_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=filepath)
    
    test_nodes = []
    rel_path = os.path.relpath(filepath, r"c:\CCIP-main\CCIP-main\backend").replace("\\", "/")
    
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if node.name.startswith("test_"):
                test_nodes.append(f"{rel_path}::{node.name}")
        elif isinstance(node, ast.ClassDef):
            if node.name.startswith("Test"):
                for sub in node.body:
                    if isinstance(sub, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        if sub.name.startswith("test_"):
                            test_nodes.append(f"{rel_path}::{node.name}::{sub.name}")
    return test_nodes

# Specifically analyze the 3 suites mentioned in the audit:
# 1. Chat suite
# 2. Combined core suite
# 3. Degraded modes / adapters / admin

suites = {
    "Investigation Chat Suite": [
        "tests/test_investigation_chat.py"
    ],
    "Core Security & Workflow Suite (7 files without chat)": [
        "tests/test_auth.py",
        "tests/test_complaints.py",
        "tests/test_workflow_lifecycle.py",
        "tests/test_security_audit_remediation.py",
        "tests/test_e2e_complete_pass.py",
        "tests/test_phase_k_e2e.py",
        "tests/test_production_hardening.py",
    ],
    "Core Suite (if chat included)": [
        "tests/test_auth.py",
        "tests/test_complaints.py",
        "tests/test_workflow_lifecycle.py",
        "tests/test_security_audit_remediation.py",
        "tests/test_e2e_complete_pass.py",
        "tests/test_phase_k_e2e.py",
        "tests/test_production_hardening.py",
        "tests/test_investigation_chat.py",
    ],
    "Degraded Modes & Adapters Suite": [
        "tests/test_model_degraded_modes.py",
        "tests/test_multi_model_adapters.py",
        "tests/test_admin_rbac.py",
    ]
}

print("=== PARSING TEST NODES PER FILE ===")
suite_nodes = {}
for s_name, files in suites.items():
    nodes = []
    for rel_f in files:
        full_p = os.path.join(r"c:\CCIP-main\CCIP-main\backend", rel_f)
        f_nodes = extract_tests_from_file(full_p)
        nodes.extend(f_nodes)
    suite_nodes[s_name] = nodes
    print(f"\n{s_name}: {len(nodes)} tests across {len(files)} files")
    for n in nodes:
        print(f"  {n}")

# Deduplication analysis
chat_nodes = set(suite_nodes["Investigation Chat Suite"])
core_without_chat = set(suite_nodes["Core Security & Workflow Suite (7 files without chat)"])
core_with_chat = set(suite_nodes["Core Suite (if chat included)"])
degraded_nodes = set(suite_nodes["Degraded Modes & Adapters Suite"])

print("\n=== DEDUPLICATION ANALYSIS (AUD-005) ===")
print(f"Chat suite unique nodes: {len(chat_nodes)}")
print(f"Core suite (7 files without chat) unique nodes: {len(core_without_chat)}")
print(f"Core suite (8 files with chat) unique nodes: {len(core_with_chat)}")
print(f"Degraded & adapter suite unique nodes: {len(degraded_nodes)}")

print(f"Intersection(Chat, Core 7 files): {chat_nodes.intersection(core_without_chat)}")
print(f"Intersection(Chat, Degraded): {chat_nodes.intersection(degraded_nodes)}")
print(f"Intersection(Core 7 files, Degraded): {core_without_chat.intersection(degraded_nodes)}")

unique_total = len(chat_nodes.union(core_without_chat).union(degraded_nodes))
print(f"\nTotal unique test nodes across all 3 suites: {unique_total}")
