"""
Migrate flat images → SKU folders (COPY mode, safe for shared images)
"""
import json, os, shutil

PROJECT = "C:/Users/23236/projects/elevator-website"
SRC = os.path.join(PROJECT, "public", "uploads")
DATA = os.path.join(PROJECT, "scripts", "product_images.json")

with open(DATA, encoding="utf-8") as f:
    products = json.load(f)

flat_files = set()
for fname in os.listdir(SRC):
    if fname.endswith((".jpg", ".png")) and os.path.isfile(os.path.join(SRC, fname)):
        flat_files.add(fname)

print(f"Flat images available: {len(flat_files)}")
print(f"Products: {len(products)}")

db_updates = []
missing_set = set()
copied_count = 0

for p in products:
    sku = p["sku"]
    old_imgs = p.get("images") or []
    if not old_imgs:
        continue
    
    sku_dir = os.path.join(SRC, sku)
    os.makedirs(sku_dir, exist_ok=True)
    
    new_imgs = []
    for idx, old_path in enumerate(old_imgs):
        fname = os.path.basename(old_path)
        src_file = os.path.join(SRC, fname)
        new_name = f"{idx + 1}.jpg"
        new_path = os.path.join(sku_dir, new_name)
        
        if os.path.exists(src_file):
            shutil.copy2(src_file, new_path)
            copied_count += 1
            new_imgs.append(f"/uploads/{sku}/{new_name}")
        else:
            missing_set.add(fname)
    
    if new_imgs:
        db_updates.append({"sku": sku, "images": new_imgs})

# Save updates
update_file = os.path.join(PROJECT, "scripts", "db_updates.json")
with open(update_file, "w", encoding="utf-8") as f:
    json.dump(db_updates, f, ensure_ascii=False, indent=2)

print(f"\n✅ Products with images: {len(db_updates)}")
print(f"📋 Images copied: {copied_count}")
print(f"❌ Missing unique filenames: {len(missing_set)}")
print(f"📝 DB updates: scripts/db_updates.json")
print(f"\n⚠️ {len(missing_set)} images only exist on Hostinger (not locally)")
