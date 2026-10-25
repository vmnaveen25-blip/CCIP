import zipfile
import json

def inspect_network():
    trace_path = r"c:\CCIP-main\test-results\02-auth-and-session-Authen-1297a-s-with-an-explanatory-error-chromium\trace.zip"
    with zipfile.ZipFile(trace_path, 'r') as z:
        for net_file in ["0-trace.network", "1-trace.network"]:
            if net_file in z.namelist():
                print(f"=== {net_file} ===")
                data = z.read(net_file).decode('utf-8', errors='ignore')
                for line in data.splitlines():
                    if "auth/login" in line or "status" in line:
                        print(line[:300])

if __name__ == "__main__":
    inspect_network()
