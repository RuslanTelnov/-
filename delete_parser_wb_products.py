import os
import requests
import json
from dotenv import load_dotenv

# Load env from the velveto-app directory
env_path = os.path.join(os.getcwd(), "temp_tlnv_parser", "velveto-app", ".env.local")
load_dotenv(env_path)

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth = (LOGIN, PASSWORD)
TARGET_FOLDER_ID = "19a36dcb-d429-11f0-0a80-09fc007fab74"

def delete_products():
    print(f"🚀 Starting MoySklad cleanup for folder ID {TARGET_FOLDER_ID}...")
    
    # 1. Fetch all products and filter manually by the target folder ID
    print(f"📦 Fetching products to filter manually...")
    target_products = []
    offset = 0
    limit = 1000
    
    while True:
        # Expand productFolder to get IDs
        url = f"{BASE_URL}/entity/product?limit={limit}&offset={offset}&expand=productFolder"
        resp = requests.get(url, auth=auth)
        if not resp.ok:
            print(f"❌ Error fetching products: {resp.status_code} {resp.text}")
            break
            
        data = resp.json()
        rows = data.get("rows", [])
        
        for p in rows:
            folder = p.get("productFolder", {})
            folder_href = folder.get("meta", {}).get("href", "")
            if TARGET_FOLDER_ID in folder_href:
                target_products.append(p)
        
        print(f"   Processed {offset + len(rows)} / {data['meta']['size']} (Found {len(target_products)} matching)")
        
        if len(rows) < limit or (offset + len(rows)) >= data["meta"]["size"]:
            break
        offset += limit

    if not target_products:
        print("ℹ️ No products found in the target folder.")
        return

    print(f"🗑️ Deleting {len(target_products)} products...")
    
    success_count = 0
    # Process in batches of 100 for bulk delete
    for i in range(0, len(target_products), 100):
        batch = target_products[i:i+100]
        batch_meta = [{"meta": p["meta"]} for p in batch]
        
        del_resp = requests.post(f"{BASE_URL}/entity/product/delete", auth=auth, json=batch_meta)
        if del_resp.status_code in [200, 204]:
            success_count += len(batch)
            print(f"   ✅ Deleted batch of {len(batch)} products ({success_count}/{len(target_products)})")
        else:
            print(f"   ❌ Batch delete failed for batch {i//100}: {del_resp.status_code} {del_resp.text}")
            print("   ⚠️ Retrying individually for this batch...")
            for p in batch:
                p_del = requests.delete(p["meta"]["href"], auth=auth)
                if p_del.status_code in [200, 204]:
                    success_count += 1
                else:
                    # Log error but continue
                    pass

    print(f"🏁 Done! Total deleted: {success_count}")

if __name__ == "__main__":
    delete_products()
