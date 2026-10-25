import zipfile
import json

def inspect_trace_actions():
    trace_path = r"c:\CCIP-main\test-results\02-auth-and-session-Authen-1297a-s-with-an-explanatory-error-chromium\trace.zip"
    with zipfile.ZipFile(trace_path, 'r') as z:
        for tname in ["0-trace.trace", "1-trace.trace", "test.trace"]:
            if tname in z.namelist():
                print(f"=== {tname} ===")
                data = z.read(tname).decode('utf-8', errors='ignore')
                for line in data.splitlines():
                    try:
                        obj = json.loads(line)
                        if "apiName" in obj:
                            print(f"{obj.get('apiName')} - {obj.get('params', {})} at {obj.get('wallTime')}")
                        elif obj.get("type") == "action":
                            print(f"Action: {obj.get('method')} {obj.get('params')} at {obj.get('wallTime')}")
                    except Exception:
                        pass

if __name__ == "__main__":
    inspect_trace_actions()
