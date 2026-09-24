"""
SerenaRaga - Step 3: Clean Customers Importer
Inserts 181 customers with preserved names, normalized WhatsApp numbers, and clean sequential IDs (1..181).
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
    if not phone or not str(phone).strip() or str(phone).strip() == "62":
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
    with open("data_backups/old_supabase/customers.json", "r", encoding="utf-8") as f:
        raw_customers = json.load(f)

    print(f"[INFO] Importing {len(raw_customers)} customers with clean sequential IDs into SerenaRaga...")

    clean_rows = []
    for idx, c in enumerate(raw_customers, start=1):
        name = (c.get("name") or f"Pelanggan {idx}").strip()
        phone = clean_phone(c.get("wa_number"), idx)
        visit_count = int(c.get("visit_count_base") or 0)
        notes = c.get("notes") or None

        clean_rows.append({
            "id": idx,
            "full_name": name,
            "phone": phone,
            "address": "Yogyakarta",
            "city_area": "Yogyakarta",
            "manual_orders_count": visit_count,
            "notes": notes,
            "created_at": c.get("created_at")
        })

    # Batch insert in chunks of 50
    inserted = []
    for i in range(0, len(clean_rows), 50):
        chunk = clean_rows[i:i+50]
        res = requests.post(f"{SUPABASE_URL}/rest/v1/customers", headers=headers, json=chunk)
        if res.status_code in [200, 201]:
            inserted.extend(res.json())
        else:
            print(f"[ERROR] Failed to insert customer chunk: {res.status_code} - {res.text}")

    print(f"[SUCCESS] Successfully inserted {len(inserted)} customers (IDs: 1 to {len(inserted)})!")

if __name__ == "__main__":
    run_import()
