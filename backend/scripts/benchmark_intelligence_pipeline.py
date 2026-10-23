"""
CCIP Intelligence Pipeline Benchmark Script
Measures cold load time, warm inference latency, and memory utilization on local CPU.
Never fabricates metrics. Outputs structured results for PHASE_K_PERFORMANCE_REPORT.md.
"""

import sys
import os
import time
import platform
import psutil
import json
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))


def get_process_memory_mb():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)


def benchmark_model(name, load_fn, infer_fn, sample_inputs, warmup_runs=1, benchmark_runs=3):
    print(f"\n--- Benchmarking {name} ---")
    mem_before = get_process_memory_mb()
    
    # Measure cold load
    t0 = time.perf_counter()
    model_obj = load_fn()
    cold_load_s = time.perf_counter() - t0
    mem_after_load = get_process_memory_mb()
    print(f"  Cold Load: {cold_load_s * 1000:.2f} ms | Memory: {mem_after_load:.1f} MB (+{mem_after_load - mem_before:.1f} MB)")
    
    # Warmup
    for _ in range(warmup_runs):
        for inp in sample_inputs:
            infer_fn(model_obj, inp)
            
    # Measure warm inference
    latencies = []
    for _ in range(benchmark_runs):
        for inp in sample_inputs:
            t0 = time.perf_counter()
            infer_fn(model_obj, inp)
            t1 = time.perf_counter()
            latencies.append((t1 - t0) * 1000)
            
    avg_latency = sum(latencies) / len(latencies)
    min_latency = min(latencies)
    max_latency = max(latencies)
    p95_latency = sorted(latencies)[int(len(latencies) * 0.95)] if len(latencies) > 1 else max_latency
    mem_final = get_process_memory_mb()
    
    print(f"  Warm Inference (avg of {len(latencies)} runs): {avg_latency:.2f} ms (min: {min_latency:.2f} ms, max: {max_latency:.2f} ms, p95: {p95_latency:.2f} ms)")
    print(f"  Peak Memory: {mem_final:.1f} MB")
    
    return {
        "model": name,
        "cold_load_ms": round(cold_load_s * 1000, 2),
        "warm_avg_ms": round(avg_latency, 2),
        "warm_min_ms": round(min_latency, 2),
        "warm_max_ms": round(max_latency, 2),
        "warm_p95_ms": round(p95_latency, 2),
        "memory_mb": round(mem_final, 1)
    }


def main():
    print("=" * 60)
    print("CCIP LOCAL CPU INTELLIGENCE PIPELINE BENCHMARK")
    print("=" * 60)
    
    env_info = {
        "os": platform.platform(),
        "python_version": platform.python_version(),
        "processor": platform.processor(),
        "cpu_count_logical": psutil.cpu_count(logical=True),
        "cpu_count_physical": psutil.cpu_count(logical=False),
        "total_ram_gb": round(psutil.virtual_memory().total / (1024**3), 2)
    }
    
    print("System Environment:")
    for k, v in env_info.items():
        print(f"  {k}: {v}")
        
    results = {
        "environment": env_info,
        "models": [],
        "pipeline": {}
    }
    
    # 1. URL Phishing
    from app.ai.url_classifier import URLPhishingClassifier
    url_inputs = [
        "https://secure-bank-login.update-kyc.in/login.php",
        "https://google.com/search?q=cybercrime",
        "http://free-lottery-gift-cards.xyz/claim?id=9928"
    ]
    res_url = benchmark_model(
        "URL Phishing (XGBoost)",
        lambda: URLPhishingClassifier(),
        lambda m, inp: m.predict(inp),
        url_inputs
    )
    results["models"].append(res_url)
    
    # 2. SMS Spam
    from app.ai.sms_classifier import SMSClassifier
    sms_inputs = [
        "Dear customer, your SBI debit card is blocked. Click http://bit.ly/sbi-unblock to update KYC immediately.",
        "Your Swiggy order #4819 has been delivered. Enjoy your meal!",
        "Congratulations! You won 50,000 INR lottery in KBC contest. Send WhatsApp to 9876543210 to claim."
    ]
    res_sms = benchmark_model(
        "SMS Spam (DistilBERT)",
        lambda: SMSClassifier(),
        lambda m, inp: m.predict(inp),
        sms_inputs
    )
    results["models"].append(res_sms)
    
    # 3. Email Threat
    from app.ai.email_classifier import EmailThreatClassifier
    email_inputs = [
        "URGENT: Your company Outlook email account will be suspended within 24 hours unless you verify credentials here: http://mail-verify-update.com",
        "Hi team, please find attached the meeting minutes for the weekly sync on Tuesday afternoon.",
        "Notice from Income Tax Department: Immediate tax refund of Rs. 42,850 pending. Enter your bank netbanking password to credit."
    ]
    res_email = benchmark_model(
        "Email Threat (DistilBERT)",
        lambda: EmailThreatClassifier(),
        lambda m, inp: m.predict(inp),
        email_inputs
    )
    results["models"].append(res_email)
    
    # 4. Complaint Classifier
    from app.ai.adapters.complaint_classifier import complaint_classifier
    complaint_inputs = [
        "I was cheated on Telegram by an investment scammer promising 30% daily returns on crypto trading. Lost 150000 rupees on UPI.",
        "Someone created a fake profile with my photos on Instagram and is sending vulgar extortion messages to my contacts.",
        "Unauthorized debit transaction of Rs. 25000 happened from my HDFC bank account without receiving any OTP."
    ]
    res_complaint = benchmark_model(
        "Complaint Classifier",
        lambda: complaint_classifier,
        lambda m, inp: m.predict(inp),
        complaint_inputs
    )
    results["models"].append(res_complaint)
    
    # 5. Cyber NER (Hybrid DeBERTa-v3 + Rules)
    from app.ai.extractors.hybrid_entity_extractor import HybridEntityExtractor
    ner_inputs = [
        "Complainant Rahul Sharma was defrauded of Rs. 75,000 by suspect Vikash who contacted via Telegram @invest_guru using phone +919876543210. Funds transferred to UPI ID scammer@oksbi.",
        "Phishing link https://sbi-netbanking-secure.org received via SMS from +919123456789 asking to update KYC. Bank HDFC account 50100234567890 debited."
    ]
    res_ner = benchmark_model(
        "Hybrid Cyber NER (DeBERTa-v3 + Rules)",
        lambda: HybridEntityExtractor(),
        lambda m, inp: m.extract(inp),
        ner_inputs
    )
    results["models"].append(res_ner)
    
    # 6. Relation Extraction
    from app.ai.adapters.relation_extraction import relation_extraction_adapter
    rel_inputs = [
        {
            "text": "Rahul Sharma transferred rupees 50000 to fraud account scammer@oksbi on GooglePay.",
            "ea": "Rahul Sharma", "eb": "scammer@oksbi", "eat": "PERSON_NAME", "ebt": "UPI_ID"
        },
        {
            "text": "The accused Vikash Patel used fake domain icici-portal.biz to impersonate ICICI Bank.",
            "ea": "Vikash Patel", "eb": "icici-portal.biz", "eat": "PERSON_NAME", "ebt": "DOMAIN"
        }
    ]
    res_rel = benchmark_model(
        "Relation Extraction (distilroberta-base)",
        lambda: relation_extraction_adapter,
        lambda m, inp: m.predict_relation(inp["text"], inp["ea"], inp["eb"], inp["eat"], inp["ebt"]),
        rel_inputs
    )
    results["models"].append(res_rel)
    
    # 7. Incident Urgency
    from app.ai.adapters.incident_urgency import incident_urgency_adapter
    urgency_inputs = [
        "EMERGENCY: Ongoing unauthorized wire transfer of 20 lakhs right now. Victim is panicking.",
        "Lost 500 rupees in a fake re-charge app last month. Reporting for record."
    ]
    res_urg = benchmark_model(
        "Incident Urgency (distilroberta-base)",
        lambda: incident_urgency_adapter,
        lambda m, inp: m.predict_urgency(inp),
        urgency_inputs
    )
    results["models"].append(res_urg)
    
    # 8. Case Similarity Pair
    from app.ai.adapters.case_similarity import case_similarity_adapter
    sim_inputs = [
        (
            "Victim received fraudulent call regarding electricity bill cutoff and paid 25000 INR on UPI.",
            "Complainant was threatened with power disconnection by fake electricity board officer and transferred 15000."
        ),
        (
            "Fake FedEx customs parcel containing illegal narcotics scam extorting money.",
            "Unauthorized ATM card cloning transaction in Delhi."
        )
    ]
    res_sim = benchmark_model(
        "Case Similarity Pair (MiniLM-L6-v2)",
        lambda: case_similarity_adapter,
        lambda m, inp: m.score_text_pair(inp[0], inp[1]),
        sim_inputs
    )
    results["models"].append(res_sim)
    
    # 9. Cross-Case Correlation Pair
    from app.ai.adapters.cross_case_correlation import cross_case_correlation_adapter
    corr_inputs = [
        {
            "a": "Victim reported loss of 80000 via fake FedEx parcel customs scam.",
            "b": "Victim coerced into transferring funds for clearing illegal customs package.",
            "feats": ["+919876543210", "fake-fedex.in"]
        },
        {
            "a": "Lottery fraud message claiming 1 crore prize.",
            "b": "Crypto mining ponzi scheme on Telegram.",
            "feats": []
        }
    ]
    res_corr = benchmark_model(
        "Cross-Case Correlation (distilroberta-base)",
        lambda: cross_case_correlation_adapter,
        lambda m, inp: m.predict_correlation(inp["a"], inp["b"], inp["feats"]),
        corr_inputs
    )
    results["models"].append(res_corr)
    
    # 10. Evidence Graph Link
    from app.ai.adapters.evidence_graph_link import evidence_graph_link_adapter
    graph_inputs = [
        [0.15] * 80,
        [0.85] * 80
    ]
    res_graph = benchmark_model(
        "Evidence Graph Link (PyTorch MLP 80-dim)",
        lambda: evidence_graph_link_adapter,
        lambda m, inp: m.predict_link(inp),
        graph_inputs
    )
    results["models"].append(res_graph)
    
    # 11. Feedback Gate
    from app.ai.adapters.feedback_gate import feedback_gate_adapter
    gate_inputs = [
        {
            "reviewer_authorized": True,
            "evidence_integrity_verified": True,
            "audit_complete": True,
            "appeal_or_reopen_pending": False,
            "case_finalized": True,
            "provenance_completeness": 0.95,
            "reviewer_count_norm": 0.8,
            "reviewer_agreement_ratio": 1.0,
            "source_diversity_norm": 0.7,
            "supporting_evidence_norm": 0.9,
            "contradiction_rate": 0.0,
            "entity_consistency": 0.95,
            "human_model_agreement": 0.9,
            "manual_verification_ratio": 1.0,
            "feedback_age_norm": 0.2,
            "cross_case_support_norm": 0.6,
            "data_quality_score": 0.92
        },
        {
            "reviewer_authorized": False,
            "evidence_integrity_verified": True,
            "audit_complete": True,
            "appeal_or_reopen_pending": False,
            "case_finalized": True,
            "provenance_completeness": 0.5,
            "reviewer_count_norm": 0.2,
            "reviewer_agreement_ratio": 0.5,
            "source_diversity_norm": 0.2,
            "supporting_evidence_norm": 0.3,
            "contradiction_rate": 0.4,
            "entity_consistency": 0.5,
            "human_model_agreement": 0.4,
            "manual_verification_ratio": 0.5,
            "feedback_age_norm": 0.8,
            "cross_case_support_norm": 0.1,
            "data_quality_score": 0.35
        }
    ]
    res_gate = benchmark_model(
        "Feedback Gate (PyTorch MLP 17-dim + Hard Gates)",
        lambda: feedback_gate_adapter,
        lambda m, inp: m.evaluate_candidate(inp),
        gate_inputs
    )
    results["models"].append(res_gate)
    
    # Summary of benchmark
    print("\n" + "=" * 60)
    print("BENCHMARK SUMMARY RESULTS TABLE")
    print("=" * 60)
    print(f"{'Model Name':<45} | {'Cold Load':<12} | {'Warm Avg':<10} | {'Peak Mem':<10}")
    print("-" * 85)
    for m in results["models"]:
        print(f"{m['model']:<45} | {m['cold_load_ms']:>8.1f} ms | {m['warm_avg_ms']:>6.1f} ms | {m['memory_mb']:>6.1f} MB")
        
    out_file = backend_dir / "benchmark_results.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved benchmark metrics to {out_file}")


if __name__ == "__main__":
    main()
