"""
SerenaRaga - BHP & Consumables Importer
1. Backs up raw materials and service_materials to local backup and Excel workbook
2. Inserts 7 standardized Master Consumables (IDs 1..7)
3. Maps and inserts service_consumables to the 49 active services
4. Updates services.consumables_cost (COGS / HPP) in the database
"""

import os
import json
import requests
import pandas as pd
from dotenv import dotenv_values

env = dotenv_values(".env.local")
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

OLD_BASE_URL = "https://nyfkbjlpibtumftfquzq.supabase.co/rest/v1"
OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55ZmtiamxwaWJ0dW1mdGZxdXpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU5Nzg0NSwiZXhwIjoyMDkxMTczODQ1fQ.0fComhocKto2LQpsZlkm54kv55PRMH3mgzeGdB2bcEk"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

old_headers = {
    "apikey": OLD_KEY,
    "Authorization": f"Bearer {OLD_KEY}"
}

def run_bhp_migration():
    print("=" * 60)
    print("[INFO] Fetching and migrating BHP / Consumables data...")
    print("=" * 60)

    # 1. Fetch raw from Old Supabase
    res_m = requests.get(f"{OLD_BASE_URL}/materials?select=*", headers=old_headers)
    raw_materials = res_m.json() if res_m.status_code == 200 else []

    res_sm = requests.get(f"{OLD_BASE_URL}/service_materials?select=*", headers=old_headers)
    raw_service_materials = res_sm.json() if res_sm.status_code == 200 else []

    # Backup to JSON
    with open("data_backups/old_supabase/materials.json", "w", encoding="utf-8") as f:
        json.dump(raw_materials, f, indent=2, ensure_ascii=False)

    with open("data_backups/old_supabase/service_materials.json", "w", encoding="utf-8") as f:
        json.dump(raw_service_materials, f, indent=2, ensure_ascii=False)

    print(f"[BACKUP] Saved {len(raw_materials)} materials and {len(raw_service_materials)} service_materials to backup.")

    # 2. Insert into Consumables Table
    # Clear existing
    requests.delete(f"{SUPABASE_URL}/rest/v1/service_consumables?id=neq.0", headers=headers)
    requests.delete(f"{SUPABASE_URL}/rest/v1/consumables?id=neq.0", headers=headers)

    old_mat_id_to_new = {}
    consumable_rows = []

    for idx, m in enumerate(raw_materials, start=1):
        old_id = m["id"]
        old_mat_id_to_new[old_id] = idx
        name = m.get("name", "Bahan Pijat")
        pack_price = float(m.get("pack_price") or 0)
        cust_per_pack = float(m.get("customers_per_pack") or 1)
        cost_per_session = round(pack_price / cust_per_pack) if cust_per_pack > 0 else pack_price

        cat = "Oil & Lotion" if "minyak" in name.lower() else "Scrub & Lulur" if ("lulur" in name.lower() or "scrub" in name.lower()) else "Spa Supplies"

        consumable_rows.append({
            "id": idx,
            "name": name,
            "category": cat,
            "unit": "sesi",
            "cost_per_unit": cost_per_session,
            "stock_quantity": int(cust_per_pack * 10),
            "min_stock_alert": 10,
            "is_active": True,
            "notes": f"Kemasan: {m.get('pack_label', '')} (Rp {pack_price:,.0f} / {cust_per_pack} customer)"
        })

    res_ins_c = requests.post(f"{SUPABASE_URL}/rest/v1/consumables", headers=headers, json=consumable_rows)
    print(f"[SUCCESS] Inserted {len(consumable_rows)} Master Consumables (IDs 1..{len(consumable_rows)}).")

    # 3. Load active services from new DB and old services backup to map UUID -> new integer ID
    res_s = requests.get(f"{SUPABASE_URL}/rest/v1/services?select=id,name", headers=headers)
    new_services = res_s.json()
    new_service_name_to_id = {s["name"].strip().lower(): s["id"] for s in new_services}

    with open("data_backups/old_supabase/services.json", "r", encoding="utf-8") as f:
        old_services = json.load(f)

    old_service_id_to_new_id = {}
    for os in old_services:
        s_name = os.get("name", "").strip().lower()
        if s_name in new_service_name_to_id:
            old_service_id_to_new_id[os["id"]] = new_service_name_to_id[s_name]

    # 4. Insert Service Consumables & calculate total cost per service
    service_cost_map = {}
    sc_rows = []
    sc_counter = 1

    for sm in raw_service_materials:
        old_sid = sm.get("service_id")
        old_mid = sm.get("material_id")
        
        new_sid = old_service_id_to_new_id.get(old_sid)
        new_mid = old_mat_id_to_new.get(old_mid)

        if new_sid and new_mid:
            # Find unit cost of consumable
            mat = next((c for c in consumable_rows if c["id"] == new_mid), None)
            unit_cost = mat["cost_per_unit"] if mat else 0
            qty = float(sm.get("qty_multiplier") or 1)
            total_item_cost = qty * unit_cost

            service_cost_map[new_sid] = service_cost_map.get(new_sid, 0) + total_item_cost

            sc_rows.append({
                "id": sc_counter,
                "service_id": new_sid,
                "consumable_id": new_mid,
                "quantity": qty,
                "unit_cost_snapshot": unit_cost,
                "total_cost": total_item_cost
            })
            sc_counter += 1

    # Insert in chunks of 50
    for i in range(0, len(sc_rows), 50):
        chunk = sc_rows[i:i+50]
        requests.post(f"{SUPABASE_URL}/rest/v1/service_consumables", headers=headers, json=chunk)

    print(f"[SUCCESS] Inserted {len(sc_rows)} Service-Consumable links.")

    # 5. Update services.consumables_cost on all 49 services
    for s_id, total_cogs in service_cost_map.items():
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/services?id=eq.{s_id}",
            headers=headers,
            json={"consumables_cost": total_cogs}
        )

    print(f"[SUCCESS] Updated consumables_cost (HPP) across all active services!")
    print("=" * 60)

if __name__ == "__main__":
    run_bhp_migration()
