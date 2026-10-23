import sys
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from pathlib import Path
import joblib
import pandas as pd
from feature_extractor import extract_features

# --------------------------------------
# Paths & Load Model
# --------------------------------------
BASE_DIR = Path(__file__).resolve().parent
if not (BASE_DIR / "models").exists():
    BASE_DIR = BASE_DIR.parent

MODEL_PATH = BASE_DIR / "models" / "phishing_model.pkl"
FEATURE_PATH = BASE_DIR / "models" / "feature_names.pkl"

model = joblib.load(MODEL_PATH)
feature_names = joblib.load(FEATURE_PATH)
print("[OK] XGBoost Model Loaded Successfully!")

# --------------------------------------
# Input URL
# --------------------------------------
url = input("\nEnter URL: ").strip()

try:
    # --------------------------------------
    # Extract Features
    # --------------------------------------
    features = extract_features(url)

    # --------------------------------------
    # Convert to DataFrame matching feature names
    # --------------------------------------
    feature_df = pd.DataFrame([features])
    feature_df = feature_df.reindex(columns=feature_names, fill_value=0)

    # -------------------------------
    # Count Suspicious Features
    # -------------------------------
    suspicious_count = sum(1 for value in features.values() if value == 1)
    print(f"\nSuspicious Features : {suspicious_count}/30")

    # -------------------------------
    # Model Prediction (XGBoost)
    # -------------------------------
    probability = model.predict_proba(feature_df)[0]
    legitimate_prob = probability[0] * 100
    phishing_prob = probability[1] * 100

    # Class 1 = Phishing, Class 0 = Legitimate
    if phishing_prob > 50 or (model.predict(feature_df)[0] == 1 and suspicious_count >= 8):
        print("Prediction : [ALERT] PHISHING WEBSITE")
        print(f"Confidence : {phishing_prob:.2f}%")
    else:
        print("Prediction : [OK] LEGITIMATE WEBSITE")
        print(f"Confidence : {legitimate_prob:.2f}%")

    print("\nExtracted Features:")
    for key, value in features.items():
        print(f"{key:30} : {value}")

except Exception as e:
    print("\n[ERROR]:", e)