import csv

with open("TESTING FILES/CCIP_Test_Case_Index.csv", "r", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

print(f"Total rows in index: {len(rows)}")

for r in rows:
    if r["test_id"].startswith("CI-"):
        print(f"  {r['test_id']}: {r['priority']} - {r['title']}")
