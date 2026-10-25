import csv
with open("TESTING FILES/CCIP_Test_Case_Index.csv", "r", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if row["test_id"] in ["AI-001", "AI-002", "AI-003", "AI-004", "AI-005"]:
            print(f"{row['test_id']}: {row['priority']} - {row['title']}")
