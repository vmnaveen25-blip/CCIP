import xml.etree.ElementTree as ET
import glob
import json

timings = {}
xml_files = sorted(glob.glob('test-results/*.xml'))
for xf in xml_files:
    tree = ET.parse(xf)
    root = tree.getroot()
    ts = root.find('testsuite')
    suite_ts = ts.attrib.get('timestamp')
    for tc in ts.findall('testcase'):
        classname = tc.attrib.get('classname')
        name = tc.attrib.get('name')
        t_sec = float(tc.attrib.get('time', 0))
        t_ms = max(int(t_sec * 1000), 5)
        node_id = f"{classname}::{name}"
        timings[node_id] = {
            "name": name,
            "classname": classname,
            "duration_ms": t_ms,
            "timestamp": suite_ts,
            "xml": xf
        }

print(f"Total test nodes parsed from JUnit XML: {len(timings)}")
with open("scratch/junit_node_timings.json", "w", encoding="utf-8") as f:
    json.dump(timings, f, indent=2)

for k, v in list(timings.items())[:15]:
    print(f"  {v['name']}: {v['duration_ms']}ms [{v['timestamp']}]")
