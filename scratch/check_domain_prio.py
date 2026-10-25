import csv
from collections import defaultdict, Counter

with open("TESTING FILES/CCIP_Test_Case_Index.csv", mode="r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

domain_prio = defaultdict(lambda: Counter())
total_prio = Counter()
domain_names = {}

for r in rows:
    sec = r["section"]
    prefix = sec.split(".")[0].strip()
    domain_names[prefix] = sec
    prio = r["priority"]
    domain_prio[prefix][prio] += 1
    total_prio[prio] += 1

print("Total by priority:", dict(total_prio))
print("\nDomain by domain (P0 / P1 / P2):")
for d in ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"]:
    c = domain_prio[d]
    total = sum(c.values())
    p0 = c.get("P0", 0)
    p1 = c.get("P1", 0)
    p2 = c.get("P2", 0)
    print(f"| **{d}** | {domain_names[d]} | {total} | {p0} / {p1} / {p2} |")
