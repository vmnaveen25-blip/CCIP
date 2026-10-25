import csv
import json
import os
import re

def main():
    csv_path = r"c:\CCIP-main\CCIP-main\TESTING FILES\CCIP_Test_Case_Index.csv"
    with open(csv_path, "r", encoding="utf-8") as f:
        cases = list(csv.DictReader(f))

    print(f"Total test cases loaded: {len(cases)}")

    # We want to inspect each case: test_id, section, title, priority, tool, preconditions, steps, expected_result
    # Group by section
    from collections import defaultdict
    by_section = defaultdict(list)
    for c in cases:
        by_section[c["section"]].append(c)

    report_lines = []
    report_lines.append(f"# Analysis of {len(cases)} Test Cases against Codebase\n")

    for sec, items in by_section.items():
        report_lines.append(f"## {sec} ({len(items)} cases)")
        for c in items:
            tid = c["test_id"]
            p = c["priority"]
            title = c["title"]
            tool = c["tool"]
            report_lines.append(f"- **[{tid}] ({p}) {title}**")
            report_lines.append(f"  - Tool: {tool}")
            report_lines.append(f"  - Steps: {c['steps']}")
            report_lines.append(f"  - Expected: {c['expected_result']}")
        report_lines.append("")

    with open(r"c:\CCIP-main\CCIP-main\scratch\cases_detailed_overview.txt", "w", encoding="utf-8") as out:
        out.write("\n".join(report_lines))

    print("Wrote cases_detailed_overview.txt successfully.")

if __name__ == "__main__":
    main()
