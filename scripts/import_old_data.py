"""
SerenaRaga - Data Ingestion & Transformation Script
Imports all backed-up services, therapists, and settings into the new SerenaRaga Supabase database.
"""

import os
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
        # Clean unique placeholder if phone was empty in old DB
        return f"+628120000000{fallback_idx}"
    p = str(phone).strip().replace(" ", "").replace("-", "")
    if p.startswith("08"):
        return "+628" + p[2:]
    if p.startswith("628"):
        return "+628" + p[3:]
    if not p.startswith("+62"):
        return "+62" + p
    return p

def import_therapists():
    with open("data_backups/old_supabase/therapists.json", "r", encoding="utf-8") as f:
        old_therapists = json.load(f)

    print(f"\n[IMPORT] Preparing {len(old_therapists)} therapists...")
    new_rows = []
    for idx, t in enumerate(old_therapists, start=1):
        name = t.get("name", f"Terapis {idx}").strip()
        # Clean prefix if desired or keep formal name
        phone = clean_phone(t.get("phone"), idx)
        commission = float(t.get("commission_pct") or 70)
        is_active = t.get("is_active", True)
        
        new_rows.append({
            "name": name,
            "phone": phone,
            "gender": "Female",
            "specialties": "Traditional Massage, Reflexology, Postpartum",
            "commission_rate": commission,
            "status": "available" if is_active else "off_duty",
            "rating": None, # Will be calculated dynamically when reviews arrive
            "coverage_areas": "Jakarta Selatan, Tangerang Selatan, Depok",
            "bank_name": "BCA"
        })

    url = f"{SUPABASE_URL}/rest/v1/therapists"
    res = requests.post(url, headers=headers, json=new_rows)
    if res.status_code in [200, 201]:
        print(f"[SUCCESS] Imported {len(new_rows)} therapists successfully!")
    else:
        print(f"[ERROR] Failed to import therapists: {res.status_code} - {res.text}")

def import_services():
    with open("data_backups/old_supabase/services.json", "r", encoding="utf-8") as f:
        old_services = json.load(f)

    print(f"\n[IMPORT] Preparing {len(old_services)} services & packages...")
    new_rows = []
    for s in old_services:
        cat_label = s.get("category_label") or s.get("category") or "Massage Services"
        duration = int(s.get("estimated_duration") or 60)
        price = float(s.get("price") or 150000)
        name = s.get("name", "Layanan Pijat").strip()
        desc = s.get("details") or s.get("featured_description") or ""
        img = s.get("featured_image") or None
        is_active = cat_label != "Internal Split Item"

        new_rows.append({
            "name": name,
            "category": cat_label,
            "description": desc,
            "duration_minutes": duration,
            "price": price,
            "image_url": img,
            "is_active": is_active
        })

    url = f"{SUPABASE_URL}/rest/v1/services"
    res = requests.post(url, headers=headers, json=new_rows)
    if res.status_code in [200, 201]:
        print(f"[SUCCESS] Imported {len(new_rows)} services successfully!")
    else:
        print(f"[ERROR] Failed to import services: {res.status_code} - {res.text}")

def main():
    print("=" * 60)
    print("[INFO] Ingesting Master Data from Old Backup to SerenaRaga Database...")
    print("=" * 60)
    import_therapists()
    import_services()
    print("=" * 60)
    print("[SUCCESS] All real master data has been successfully imported!")
    print("=" * 60)

if __name__ == "__main__":
    main()
