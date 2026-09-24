import os
import requests
import json
from dotenv import dotenv_values

env = dotenv_values(".env.local")
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_KEY in .env.local")
    exit(1)

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Tables to clean in order of Foreign Key constraints
TABLES_TO_CLEAN = [
    "invoices",
    "therapist_payouts",
    "reviews",
    "bookings",
    "customers",
    "therapists",
    "services"
]

def clean_table(table_name):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?id=neq.0"
    res = requests.delete(url, headers=headers)
    if res.status_code in [200, 204]:
        print(f"[OK] Cleared table: {table_name}")
    else:
        print(f"[WARN] Table {table_name}: status {res.status_code} - {res.text}")

def main():
    print("[INFO] Cleaning dummy/test data from SerenaRaga database...")
    for table in TABLES_TO_CLEAN:
        clean_table(table)
    print("[SUCCESS] Database cleanup complete! Ready for real data migration.")

if __name__ == "__main__":
    main()
