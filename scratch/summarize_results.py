import csv
from collections import defaultdict, Counter

with open("TESTING FILES/CCIP_TEST_RESULTS.csv", "r", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

prio_breakdown = defaultdict(Counter)
domain_breakdown = defaultdict(Counter)

for r in rows:
    prio_breakdown[r["priority"]][r["status"]] += 1
    sec_prefix = r["section"].split(".")[0].strip()
    domain_breakdown[sec_prefix][r["status"]] += 1

print("=== PRIORITY BREAKDOWN ===")
for p in ["P0", "P1", "P2"]:
    c = prio_breakdown[p]
    total = sum(c.values())
    print(f"{p}: Total={total}, PASS={c['PASS']}, BLOCKED={c['BLOCKED']}, NOT RUN={c['NOT RUN']}, FAIL={c['FAIL']}")

print("\n=== DOMAIN BREAKDOWN ===")
for d in ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"]:
    c = domain_breakdown[d]
    total = sum(c.values())
    print(f"Domain {d}: Total={total}, PASS={c['PASS']}, BLOCKED={c['BLOCKED']}, NOT RUN={c['NOT RUN']}, FAIL={c['FAIL']}")
