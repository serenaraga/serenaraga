import urllib.request
import json

SUPABASE_URL = "https://jbnvxlwjffanqusfrhpk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibnZ4bHdqZmZhbnF1c2ZyaHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxOTgyOTksImV4cCI6MjEwNDc3NDI5OX0.kNIuFJZJbKgWYeU0XsGcxV1hWiU2Ix4bZG7UCVCr1Us"

def standardize_phone(p):
    if not p:
        return ""
    raw = str(p).strip()
    if not raw:
        return ""
    if raw.startswith("+"):
        digits = "".join(c for c in raw if c.isdigit())
        if digits.startswith("0"):
            return "+62" + digits.lstrip("0")
        return "+" + digits
    digits = "".join(c for c in raw if c.isdigit())
    if not digits:
        return ""
    if digits.startswith("0"):
        return "+62" + digits.lstrip("0")
    if digits.startswith("62"):
        return "+" + digits
    if digits.startswith("8"):
        return "+62" + digits
    return "+62" + digits

def main():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    # 1. Standardize Customers
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/customers?select=id,full_name,phone",
        headers=headers
    )
    with urllib.request.urlopen(req) as resp:
        customers = json.loads(resp.read().decode())

    cust_count = 0
    for c in customers:
        cid = c["id"]
        orig = c.get("phone") or ""
        std = standardize_phone(orig)
        if std and std != orig:
            update_req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/customers?id=eq.{cid}",
                data=json.dumps({"phone": std}).encode(),
                headers=headers,
                method="PATCH"
            )
            with urllib.request.urlopen(update_req):
                pass
            print(f"[Customer #{cid}] {c.get('full_name')}: {orig} -> {std}")
            cust_count += 1

    print(f"-> Customers standardized: {cust_count}")

    # 2. Standardize Invoices
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/invoices?select=id,customer_name,customer_phone",
        headers=headers
    )
    with urllib.request.urlopen(req) as resp:
        invoices = json.loads(resp.read().decode())

    inv_count = 0
    for inv in invoices:
        iid = inv["id"]
        orig = inv.get("customer_phone") or ""
        std = standardize_phone(orig)
        if std and std != orig:
            update_req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/invoices?id=eq.{iid}",
                data=json.dumps({"customer_phone": std}).encode(),
                headers=headers,
                method="PATCH"
            )
            with urllib.request.urlopen(update_req):
                pass
            print(f"[Invoice #{iid}] {inv.get('customer_name')}: {orig} -> {std}")
            inv_count += 1

    print(f"-> Invoices standardized: {inv_count}")

    # 3. Standardize Therapists
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/therapists?select=id,name,phone,emergency_contact_phone",
        headers=headers
    )
    with urllib.request.urlopen(req) as resp:
        therapists = json.loads(resp.read().decode())

    thp_count = 0
    for t in therapists:
        tid = t["id"]
        orig_p = t.get("phone") or ""
        orig_em = t.get("emergency_contact_phone") or ""
        std_p = standardize_phone(orig_p)
        std_em = standardize_phone(orig_em)
        updates = {}
        if std_p and std_p != orig_p:
            updates["phone"] = std_p
        if std_em and std_em != orig_em:
            updates["emergency_contact_phone"] = std_em
        if updates:
            update_req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/therapists?id=eq.{tid}",
                data=json.dumps(updates).encode(),
                headers=headers,
                method="PATCH"
            )
            with urllib.request.urlopen(update_req):
                pass
            print(f"[Therapist #{tid}] {t.get('name')}: {updates}")
            thp_count += 1

    print(f"-> Therapists standardized: {thp_count}")
    print("[ALL DONE] All database phone numbers are now standardized to +62.")

if __name__ == "__main__":
    main()
