"""
SerenaRaga - Step 2: Clean Therapists Importer
Inserts 6 therapists with original prefix, empty specialties, and clean commission rates.
"""

import json
import requests
from dotenv import dotenv_values

env = dotenv_values(".env.local")
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def clean_phone(phone, fallback_idx=1):
    if not phone or not str(phone).strip():
        return f"+628120000000{fallback_idx}"
    p = str(phone).strip().replace(" ", "").replace("-", "")
    if p.startswith("08"):
        return "+628" + p[2:]
    if p.startswith("628"):
        return "+628" + p[3:]
    if not p.startswith("+62"):
        return "+62" + p
    return p

def run_import():
    with open("data_backups/old_supabase/therapists.json", "r", encoding="utf-8") as f:
        raw_therapists = json.load(f)

    print(f"[INFO] Importing {len(raw_therapists)} therapists into SerenaRaga...")

    clean_rows = []
    for idx, t in enumerate(raw_therapists, start=1):
        name = t.get("name", f"Terapis {idx}").strip()
        phone = clean_phone(t.get("phone"), idx)
        commission = float(t.get("commission_pct") or 70)
        is_active = t.get("is_active", True)

        clean_rows.append({
            "id": idx,
            "name": name,
            "phone": phone,
            "gender": "Female",
            "specialties": None,
            "commission_rate": commission,
            "status": "available" if is_active else "off_duty",
            "rating": None,
            "coverage_areas": "Yogyakarta & Sekitarnya",
            "bank_name": "BCA"
        })

    url = f"{SUPABASE_URL}/rest/v1/therapists"
    res = requests.post(url, headers=headers, json=clean_rows)
    if res.status_code in [200, 201]:
        data = res.json()
        print(f"[SUCCESS] Successfully inserted {len(data)} therapists into database!")
    else:
        print(f"[ERROR] Failed to insert therapists: {res.status_code} - {res.text}")

if __name__ == "__main__":
    run_import()
