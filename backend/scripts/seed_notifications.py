import sqlite3
import uuid
import datetime
import json

def seed_notifications():
    conn = sqlite3.connect('c:/CCIP-main/CCIP-main/backend/ccip.db')
    cur = conn.cursor()
    cur.execute('SELECT id, email, full_name FROM users')
    users = cur.fetchall()
    print(f"Found {len(users)} users in database.")

    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

    sample_alerts = [
        (
            '1930 HELPLINE ASSET FREEZE ACTIVE',
            'National Financial Cyber Fraud Reporting System (1930) operational. Bank nodal freeze intervention window active for financial distress reporting.',
            'ASSET_FREEZE',
            'CRITICAL',
            0,
            json.dumps({"source": "NATIONAL_ENCLAVE_NODAL", "helpline": "1930"})
        ),
        (
            'ACTIVE THREAT ADVISORY: UPI & APK PHISHING WAVE',
            'CERT-In national cyber bulletin: Active campaigns detected using fake electricity disconnection alerts and malicious APK install links. Do not share OTPs.',
            'ADVISORY',
            'HIGH',
            0,
            json.dumps({"bulletin_id": "CERT-IN-2026-09A", "category": "UPI Fraud"})
        ),
        (
            'ZERO-KNOWLEDGE EVIDENCE SEALING INITIALIZED',
            'Citizen digital identity and cryptographic evidence hashing keys verified. Direct SHA-256 evidence integrity logging active in national enclave.',
            'SECURITY',
            'INFO',
            0,
            json.dumps({"models": ["SpectrogramCNN", "DistilRoBERTa", "XGBoost"]})
        )
    ]

    total_seeded = 0
    for uid, email, name in users:
        cur.execute('SELECT count(*) FROM notifications WHERE user_id = ?', (uid,))
        count = cur.fetchone()[0]
        print(f"User {name} ({email}) currently has {count} notifications.")
        if count == 0:
            for title, msg, n_type, sev, is_read, meta in sample_alerts:
                nid = str(uuid.uuid4())
                cur.execute('''
                    INSERT INTO notifications (id, user_id, title, message, notification_type, severity, metadata_json, is_read, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (nid, uid, title, msg, n_type, sev, meta, is_read, now))
                total_seeded += 1
            print(f"  -> Seeded 3 default enclave alerts for {email}")

    conn.commit()
    conn.close()
    print(f"Seeding completed. Total new notifications inserted: {total_seeded}")

if __name__ == '__main__':
    seed_notifications()
