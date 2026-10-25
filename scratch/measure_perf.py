import urllib.request
import time
import json
import statistics

url = "http://127.0.0.1:8000/api/v1/health"
num_requests = 100
latencies = []
errors = 0

start_total = time.perf_counter()
for i in range(num_requests):
    t0 = time.perf_counter()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CCIP-Perf-Benchmark/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read()
            if resp.status != 200:
                errors += 1
    except Exception as e:
        errors += 1
    t1 = time.perf_counter()
    latencies.append((t1 - t0) * 1000.0)

total_duration = time.perf_counter() - start_total

latencies.sort()
p50 = statistics.median(latencies)
p90 = latencies[int(len(latencies) * 0.90)]
p95 = latencies[int(len(latencies) * 0.95)]
p99 = latencies[int(len(latencies) * 0.99)]
mean = statistics.mean(latencies)
min_lat = min(latencies)
max_lat = max(latencies)
rps = num_requests / total_duration

result = {
    "target_url": url,
    "total_requests": num_requests,
    "successful_requests": num_requests - errors,
    "error_rate": f"{(errors / num_requests) * 100:.1f}%",
    "total_duration_sec": round(total_duration, 3),
    "throughput_rps": round(rps, 2),
    "latency_ms": {
        "min": round(min_lat, 2),
        "mean": round(mean, 2),
        "p50": round(p50, 2),
        "p90": round(p90, 2),
        "p95": round(p95, 2),
        "p99": round(p99, 2),
        "max": round(max_lat, 2)
    }
}

print(json.dumps(result, indent=2))

with open("scratch/perf_benchmark_health.json", "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2)
