import csv
from collections import defaultdict, Counter

with open("TESTING FILES/CCIP_Test_Case_Index.csv", "r", encoding="utf-8") as f:
    index_rows = {r["test_id"]: r for r in csv.DictReader(f)}

print(f"Total rows in index: {len(index_rows)}")

non_pass_ids = {
    "E2E-003": "BLOCKED",
    "AI-003": "BLOCKED",
    "CI-008": "NOT RUN",
    "PERF-002": "NOT RUN",
    "PERF-003": "NOT RUN",
    "PERF-004": "NOT RUN",
    "PERF-005": "NOT RUN",
    "PERF-006": "NOT RUN",
    "PERF-007": "NOT RUN",
    "PERF-008": "NOT RUN",
}

print("=== NON-PASS CASES IN AUTHORITATIVE INDEX ===")
for tid, st in non_pass_ids.items():
    p = index_rows[tid]["priority"]
    title = index_rows[tid]["title"]
    print(f"  {tid} [{p}]: {st} - {title}")

prio_counts = defaultdict(Counter)
domain_counts = defaultdict(Counter)

for tid, row in index_rows.items():
    st = non_pass_ids.get(tid, "PASS")
    prio = row["priority"]
    sec_prefix = row["section"].split(".")[0].strip()
    prio_counts[prio][st] += 1
    domain_counts[sec_prefix][st] += 1

print("\n=== RECONCILED PRIORITY BREAKDOWN ===")
for p in ["P0", "P1", "P2"]:
    c = prio_counts[p]
    tot = sum(c.values())
    print(f"{p}: Total={tot}, PASS={c['PASS']}, BLOCKED={c['BLOCKED']}, NOT RUN={c['NOT RUN']}, FAIL={c['FAIL']}")

print("\n=== RECONCILED DOMAIN BREAKDOWN ===")
for d in ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"]:
    c = domain_counts[d]
    tot = sum(c.values())
    print(f"Domain {d}: Total={tot}, PASS={c['PASS']}, BLOCKED={c['BLOCKED']}, NOT RUN={c['NOT RUN']}, FAIL={c['FAIL']}")
