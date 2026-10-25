import json

def inspect_domains():
    with open(r"c:\CCIP-main\CCIP-main\scratch\parsed_test_cases.json", encoding="utf-8") as f:
        tests = json.load(f)

    # Let's inspect test cases by section
    from collections import defaultdict
    by_sec = defaultdict(list)
    for t in tests:
        by_sec[t["section"]].append(t)

    for sec, t_list in by_sec.items():
        print(f"\n=== {sec} ({len(t_list)} tests) ===")
        for t in t_list:
            print(f"[{t['test_id']}] ({t['priority']}) {t['title']} | Tool: {t['tool']}")

if __name__ == "__main__":
    inspect_domains()
