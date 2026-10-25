import urllib.request
import json
import time

def test_login():
    url = "http://localhost:5173/api/v1/auth/login"
    data = json.dumps({"email": "invalid.user@unregistered.org", "password": "WrongPassword#9999"}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    t0 = time.time()
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        print(f"Success: {resp.status} in {time.time()-t0:.2f}s")
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} in {time.time()-t0:.2f}s: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Exception in {time.time()-t0:.2f}s: {e}")

if __name__ == "__main__":
    test_login()
