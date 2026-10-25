import csv
with open("TESTING FILES/CCIP_Test_Case_Index.csv", "r", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if row["test_id"].startswith("PERF-"):
            print(f"{row['test_id']}: {row['priority']} - {row['title']}")
