import sys
from pathlib import Path

# Add backend to path
BACKEND_DIR = Path("c:/CCIP-main/CCIP-main/backend")
sys.path.insert(0, str(BACKEND_DIR))

from app.ai.url_classifier import url_classifier
from app.ai.sms_classifier import sms_classifier
from app.ai.email_classifier import email_classifier
from app.ai.adapters.citizen_assistant import citizen_assistant_adapter

print("=" * 60)
print("TESTING URL PHISHING DETECTOR")
print("=" * 60)

test_urls = [
    "www.wertyu@.tech/ai.com",
    "http://paypal.com.account-update.xyz/login",
    "http://192.168.1.1/login.php",
    "https://bank-security-update-account-verification-alert.com/login@admin",
    "https://www.google.com",
    "https://github.com/torvalds/linux",
    "https://cybercrime.gov.in"
]

for u in test_urls:
    try:
        res = citizen_assistant_adapter.analyze_threat(u, "url")
        print(f"URL: {u}")
        print(f"  Verdict: {res['risk_level']} | Threat: {res['is_threat']} | Conf: {res['confidence']:.2%}")
        print(f"  Reasons: {res['explainable_reasons']}")
    except Exception as e:
        print(f"URL: {u} -> ERROR: {e}")

print("\n" + "=" * 60)
print("TESTING SMS SCAM DETECTOR")
print("=" * 60)

test_sms = [
    "Dear SBI user, your YONO account is locked. Update PAN immediately to avoid debit freeze: http://sbi-kyc.top",
    "Congratulations! You won 25,00,000 lottery from KBC. Send details to claim prize on WhatsApp.",
    "Hey dad, are you coming home for dinner tonight?",
    "Your OTP for transaction of Rs 4500 is 849201. Never share this with anyone."
]

for s in test_sms:
    try:
        res = citizen_assistant_adapter.analyze_threat(s, "sms")
        print(f"SMS: {s[:60]}...")
        print(f"  Verdict: {res['risk_level']} | Threat: {res['is_threat']} | Conf: {res['confidence']:.2%}")
        print(f"  Reasons: {res['explainable_reasons']}")
    except Exception as e:
        print(f"SMS: {s[:60]}... -> ERROR: {e}")

print("\n" + "=" * 60)
print("TESTING EMAIL THREAT DETECTOR")
print("=" * 60)

test_emails = [
    "URGENT: Outstanding Invoice #9910. Please wire payment immediately to the updated account details below.",
    "CYBER CRIME POLICE NOTICE: An arrest warrant has been issued in your name. Download the attached court summons.",
    "Weekly sprint review notes: The team accomplished 92% of sprint goals. Next meeting on Thursday.",
    "Your Microsoft 365 password expires in 2 hours. Click here to retain your current password: http://ms-security.xyz"
]

for em in test_emails:
    try:
        res = citizen_assistant_adapter.analyze_threat(em, "email")
        print(f"Email: {em[:60]}...")
        print(f"  Verdict: {res['risk_level']} | Threat: {res['is_threat']} | Conf: {res['confidence']:.2%}")
        print(f"  Reasons: {res['explainable_reasons']}")
    except Exception as e:
        print(f"Email: {em[:60]}... -> ERROR: {e}")
