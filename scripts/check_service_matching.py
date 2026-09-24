import json
import requests
from dotenv import dotenv_values

old_b = json.load(open('data_backups/old_supabase/bookings.json', encoding='utf-8'))
bi = json.load(open('data_backups/old_supabase/booking_items.json', encoding='utf-8'))
old_s = json.load(open('data_backups/old_supabase/services.json', encoding='utf-8'))

old_sid_to_name = {s['id']: s['name'] for s in old_s}

# Sort booking items so real services come first (not transport/addon)
def item_priority(item):
    name = (item.get('service_name') or '').lower()
    if any(w in name for w in ['transport', 'charge fee', 'villa', 'tambahan']):
        return 2
    if item.get('service_id'):
        return 0
    return 1

bi.sort(key=item_priority)

booking_to_primary_service = {}
for item in bi:
    bid = item['booking_id']
    if bid not in booking_to_primary_service:
        sid = item.get('service_id')
        sname = item.get('service_name') or old_sid_to_name.get(sid)
        booking_to_primary_service[bid] = {
            'old_service_id': sid,
            'service_name': sname,
            'price': item.get('price')
        }

env = dotenv_values('.env.local')
url = env['NEXT_PUBLIC_SUPABASE_URL']
key = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
h = {'apikey': key, 'Authorization': f'Bearer {key}'}

new_services = requests.get(f"{url}/rest/v1/services?select=id,name", headers=h).json()
new_name_to_id = {s['name'].strip().lower(): (s['id'], s['name']) for s in new_services}

# Manual synonym aliases
ALIASES = {
    'reflex': 'Reflex Flow',
    'devotion package wanita': 'Devotion Package',
    'devotion package pria': 'Devotion Package',
    'devotion package pria + devotion package wanita': 'Devotion Package',
}

matched = 0
unmatched = []

for b in old_b:
    bid = b['id']
    primary = booking_to_primary_service.get(bid)
    raw_sname = b.get('service_name', '')
    
    candidates = []
    if primary and primary.get('service_name'):
        candidates.append(primary['service_name'].strip())
    if raw_sname:
        candidates.append(raw_sname.strip())
        if '+' in raw_sname:
            candidates.append(raw_sname.split('+')[0].strip())
            
    found_id = None
    found_name = None
    for cand in candidates:
        cand_lower = cand.lower()
        if cand_lower in ALIASES:
            target = ALIASES[cand_lower].lower()
            if target in new_name_to_id:
                found_id, found_name = new_name_to_id[target]
                break
        if cand_lower in new_name_to_id:
            found_id, found_name = new_name_to_id[cand_lower]
            break
            
    if found_id:
        matched += 1
    else:
        unmatched.append({
            'raw': raw_sname,
            'primary': primary,
            'candidates': candidates
        })

print(f"Matched: {matched}/{len(old_b)}")
print(f"Unmatched: {len(unmatched)}")
