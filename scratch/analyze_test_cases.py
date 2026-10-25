import csv
import json

def analyze_csv():
    csv_path = r"c:\CCIP-main\CCIP-main\TESTING FILES\CCIP_Test_Case_Index.csv"
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Total rows: {len(rows)}")
    sections = {}
    for r in rows:
        sec = r["section"]
        if sec not in sections:
            sections[sec] = []
        sections[sec].append(r)

    summary = {}
    for sec, items in sections.items():
        summary[sec] = {
            "count": len(items),
            "test_ids": [x["test_id"] for x in items],
            "priorities": {p: sum(1 for x in items if x["priority"] == p) for p in set(x["priority"] for x in items)}
        }
    
    with open(r"c:\CCIP-main\CCIP-main\scratch\parsed_test_cases.json", "w", encoding="utf-8") as out:
        json.dump(rows, out, indent=2)

    print("Sections summary:")
    for s, data in summary.items():
        print(f"  {s}: {data['count']} tests ({data['priorities']}) -> {data['test_ids'][0]} to {data['test_ids'][-1]}")

if __name__ == "__main__":
    analyze_csv()
