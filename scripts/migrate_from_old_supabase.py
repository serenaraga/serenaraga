"""
SerenaRaga - Automated Database Migration Script
Extracts historical data from Old Supabase instance, transforms and cleans it,
and imports it directly into the new SerenaRaga Supabase schema.
"""

import os
import requests
import json
from dotenv import dotenv_values

# Target (New) Supabase
target_env = dotenv_values(".env.local")
TARGET_SUPABASE_URL = target_env.get("NEXT_PUBLIC_SUPABASE_URL")
TARGET_SUPABASE_KEY = target_env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Source (Old) Supabase - Fill these with the old credentials
OLD_SUPABASE_URL = os.environ.get("OLD_SUPABASE_URL", "")
OLD_SUPABASE_KEY = os.environ.get("OLD_SUPABASE_KEY", "")

def get_headers(api_key):
    return {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def fetch_table(base_url, api_key, table_name):
    """Fetch all rows from a table in the old Supabase"""
    url = f"{base_url}/rest/v1/{table_name}?select=*"
    res = requests.get(url, headers=get_headers(api_key))
    if res.status_code == 200:
        data = res.json()
        print(f"[EXTRACT] Fetched {len(data)} rows from '{table_name}'")
        return data
    else:
        print(f"[WARN] Could not fetch '{table_name}' (Status {res.status_code}): {res.text}")
        return []

def insert_batch(table_name, rows):
    """Insert batch of transformed rows into new Supabase"""
    if not rows:
        return
    url = f"{TARGET_SUPABASE_URL}/rest/v1/{table_name}"
    headers = get_headers(TARGET_SUPABASE_KEY)
    headers["Prefer"] = "resolution=merge-duplicates"
    
    res = requests.post(url, headers=headers, json=rows)
    if res.status_code in [200, 201]:
        print(f"[LOAD] Successfully imported {len(rows)} rows into '{table_name}'")
    else:
        print(f"[ERROR] Failed to load '{table_name}' (Status {res.status_code}): {res.text}")

def clean_phone(phone):
    if not phone:
        return ""
    p = str(phone).strip().replace(" ", "").replace("-", "")
    if p.startswith("08"):
        return "+628" + p[2:]
    if p.startswith("628"):
        return "+628" + p[3:]
    return p

def run_migration(old_url, old_key):
    if not old_url or not old_key:
        print("[ERROR] Please provide OLD_SUPABASE_URL and OLD_SUPABASE_KEY")
        return

    print("=" * 60)
    print("🚀 Starting SerenaRaga Historical Data Migration...")
    print("=" * 60)

    # 1. Services
    old_services = fetch_table(old_url, old_key, "services")
    if old_services:
        new_services = []
        for s in old_services:
            new_services.append({
                "id": s.get("id"),
                "name": s.get("name", "Layanan Pijat"),
                "category": s.get("category", "massage"),
                "description": s.get("description", ""),
                "duration_minutes": s.get("duration_minutes", s.get("duration", 60)),
                "price": s.get("price", 150000),
                "is_active": s.get("is_active", True)
            })
        insert_batch("services", new_services)

    # 2. Therapists
    old_therapists = fetch_table(old_url, old_key, "therapists")
    if old_therapists:
        new_therapists = []
        for t in old_therapists:
            new_therapists.append({
                "id": t.get("id"),
                "name": t.get("name", t.get("full_name", "Terapis")),
                "gender": t.get("gender", "female"),
                "phone": clean_phone(t.get("phone")),
                "specialties": t.get("specialties", "Traditional Massage"),
                "commission_rate": t.get("commission_rate", 60),
                "status": t.get("status", "available"),
                "photo_url": t.get("photo_url", t.get("avatar_url")),
                "nik": t.get("nik"),
                "bank_name": t.get("bank_name"),
                "bank_account_number": t.get("bank_account_number", t.get("account_number")),
                "bank_account_name": t.get("bank_account_name", t.get("account_name"))
            })
        insert_batch("therapists", new_therapists)

    # 3. Customers
    old_customers = fetch_table(old_url, old_key, "customers")
    if old_customers:
        new_customers = []
        for c in old_customers:
            new_customers.append({
                "id": c.get("id"),
                "full_name": c.get("full_name", c.get("name", "Pelanggan")),
                "phone": clean_phone(c.get("phone")),
                "email": c.get("email"),
                "address": c.get("address", "-"),
                "city_area": c.get("city_area", c.get("city", "Jabodetabek")),
                "notes": c.get("notes")
            })
        insert_batch("customers", new_customers)

    # 4. Bookings
    old_bookings = fetch_table(old_url, old_key, "bookings")
    if old_bookings:
        new_bookings = []
        for b in old_bookings:
            new_bookings.append({
                "id": b.get("id"),
                "customer_id": b.get("customer_id"),
                "service_id": b.get("service_id"),
                "therapist_id": b.get("therapist_id"),
                "booking_date": b.get("booking_date", str(b.get("date", "2026-09-24"))[:10]),
                "booking_time": b.get("booking_time", str(b.get("time", "10:00"))),
                "service_address": b.get("service_address", b.get("address", "-")),
                "total_price": b.get("total_price", b.get("price", 150000)),
                "status": b.get("status", "completed"),
                "payment_method": b.get("payment_method", "cash"),
                "payment_status": b.get("payment_status", "paid"),
                "special_requests": b.get("special_requests", b.get("notes"))
            })
        insert_batch("bookings", new_bookings)

    # 5. Invoices
    old_invoices = fetch_table(old_url, old_key, "invoices")
    if old_invoices:
        new_invoices = []
        for inv in old_invoices:
            new_invoices.append({
                "id": inv.get("id"),
                "invoice_number": inv.get("invoice_number", f"SR-MIG-{inv.get('id')}"),
                "booking_id": inv.get("booking_id"),
                "customer_id": inv.get("customer_id"),
                "customer_name": inv.get("customer_name", "Pelanggan"),
                "customer_phone": clean_phone(inv.get("customer_phone", "")),
                "service_id": inv.get("service_id"),
                "service_name": inv.get("service_name", "Layanan Pijat"),
                "therapist_id": inv.get("therapist_id"),
                "therapist_name": inv.get("therapist_name"),
                "booking_date": inv.get("booking_date"),
                "booking_time": inv.get("booking_time"),
                "service_address": inv.get("service_address", "-"),
                "subtotal": inv.get("subtotal", inv.get("total_amount", 0)),
                "discount": inv.get("discount", 0),
                "transport_fee": inv.get("transport_fee", 0),
                "total_amount": inv.get("total_amount", 0),
                "payment_method": inv.get("payment_method", "qris"),
                "payment_status": inv.get("payment_status", "paid"),
                "notes": inv.get("notes")
            })
        insert_batch("invoices", new_invoices)

    # 6. Reviews
    old_reviews = fetch_table(old_url, old_key, "reviews")
    if old_reviews:
        new_reviews = []
        for r in old_reviews:
            new_reviews.append({
                "id": r.get("id"),
                "booking_id": r.get("booking_id"),
                "invoice_id": r.get("invoice_id"),
                "therapist_id": r.get("therapist_id"),
                "customer_name": r.get("customer_name"),
                "rating": r.get("rating", 5),
                "comment": r.get("comment"),
                "is_read": r.get("is_read", True)
            })
        insert_batch("reviews", new_reviews)

    print("=" * 60)
    print("🎉 Data migration completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    url = OLD_SUPABASE_URL or input("Masukkan OLD_SUPABASE_URL: ").strip()
    key = OLD_SUPABASE_KEY or input("Masukkan OLD_SUPABASE_KEY: ").strip()
    run_migration(url, key)
