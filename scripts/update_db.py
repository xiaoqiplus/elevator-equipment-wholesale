"""
Update database with new image paths
Uses admin PUT API to update each product's images
"""
import json, subprocess, time

COOKIE = "C:/Users/23236/AppData/Local/Temp/adm_upd.txt"
UPDATES = "C:/Users/23236/projects/elevator-website/scripts/db_updates.json"

# Copy cookie
subprocess.run(["cp", "/tmp/adm.txt", COOKIE], shell=True)

with open(UPDATES, encoding="utf-8") as f:
    updates = json.load(f)

success = 0
failed = 0
for i, item in enumerate(updates):
    sku = item["sku"]
    images = item["images"]
    
    data = json.dumps({"sku": sku, "images": images})
    r = subprocess.run(
        ["curl", "-sk", "-b", COOKIE, "-X", "PUT",
         "-H", "Content-Type: application/json",
         "-d", data,
         "https://quickeaseliftparts.com/api/admin/products"],
        capture_output=True, text=True, timeout=15
    )
    
    if "ok" in r.stdout:
        success += 1
    else:
        failed += 1
        print(f"  ❌ {sku}: {r.stdout[:80]}")
    
    if (i + 1) % 100 == 0:
        print(f"  Progress: {i+1}/{len(updates)} (OK: {success}, Failed: {failed})")
        time.sleep(0.5)  # Rate limit

print(f"\n✅ DB update complete")
print(f"  Success: {success}")
print(f"  Failed: {failed}")
