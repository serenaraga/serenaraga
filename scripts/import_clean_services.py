"""
SerenaRaga - Step 1: Clean Services Importer
Inserts 49 standardized user-facing services across 6 official categories.
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

CATEGORY_MAP = {
    "packages": "Massage Packages",
    "Massage Packages": "Massage Packages",
    "services": "Massage Services",
    "Massage Services": "Massage Services",
    "reflexology": "Refleksi Service",
    "Refleksi Service": "Refleksi Service",
    "couple": "Couple Package",
    "Couple Package": "Couple Package",
    "kids": "Kids & Mom Services",
    "Kids & Mom Services": "Kids & Mom Services",
    "addons": "Add-On Service",
    "Add-On Service": "Add-On Service"
}

def run_import():
    with open("data_backups/old_supabase/services.json", "r", encoding="utf-8") as f:
        raw_services = json.load(f)

    # Exclude internal technical split items
    active_services = [
        s for s in raw_services 
        if s.get("category") != "split_items" and s.get("category_label") != "Internal Split Item"
    ]

    print(f"[INFO] Importing {len(active_services)} standardized services into SerenaRaga...")

    clean_rows = []
    for idx, s in enumerate(active_services, start=1):
        raw_cat = s.get("category_label") or s.get("category") or "Massage Services"
        cat = CATEGORY_MAP.get(raw_cat, raw_cat)
        
        name = s.get("name", "Layanan Pijat").strip()
        desc = s.get("details") or s.get("featured_description") or ""
        dur = int(s.get("estimated_duration") or 60)
        price = float(s.get("price") or 150000)
        img = s.get("featured_image") or None

        clean_rows.append({
            "id": idx,
            "name": name,
            "category": cat,
            "description": desc,
            "duration_minutes": dur,
            "price": price,
            "image_url": img,
            "is_active": True
        })

    url = f"{SUPABASE_URL}/rest/v1/services"
    res = requests.post(url, headers=headers, json=clean_rows)
    if res.status_code in [200, 201]:
        data = res.json()
        print(f"[SUCCESS] Successfully inserted {len(data)} clean services into database!")
    else:
        print(f"[ERROR] Failed to insert services: {res.status_code} - {res.text}")

if __name__ == "__main__":
    run_import()
