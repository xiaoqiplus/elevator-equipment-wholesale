import subprocess, json, sys

COOKIE = "C:/Users/23236/AppData/Local/Temp/adm.txt"
# Copy the git-bash cookie file to a Windows-accessible location
subprocess.run(["cp", "/tmp/adm.txt", COOKIE], shell=True, capture_output=True)

BASE = "https://quickeaseliftparts.com/api/admin/products?limit=100&page="
OUT = "C:/Users/23236/projects/elevator-website/scripts/product_images.json"

def curl(url):
    r = subprocess.run(["curl", "-sk", "-b", COOKIE, url],
        capture_output=True, text=True, timeout=30)
    return r.stdout

# Get first page
raw = curl(BASE + "1")
data = json.loads(raw)
total = data["total"]
pages = data["totalPages"]
print(f"Total: {total}, Pages: {pages}")

all_products = []
for page in range(1, pages + 1):
    raw = curl(BASE + str(page))
    d = json.loads(raw)
    all_products.extend(d["products"])
    print(f"  Page {page}: {len(d['products'])}", flush=True)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(all_products, f, ensure_ascii=False, indent=2)

print(f"\n✅ Saved {len(all_products)} products")
