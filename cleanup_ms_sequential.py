import os
import requests
import json
import time
from dotenv import load_dotenv

env_path = os.path.join(os.getcwd(), ".env")
load_dotenv(env_path)

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth = (LOGIN, PASSWORD)
TARGET_FOLDER_ID = "19a36dcb-d429-11f0-0a80-09fc007fab74"

def delete_dependency(dependency_href):
    print(f"      🔗 Dependency: {dependency_href}")
    try:
        resp = requests.delete(dependency_href, auth=auth, timeout=10)
        if resp.status_code in [200, 204, 404]:
            return True
        print(f"      ❌ Failed dep: {resp.status_code} {resp.text[:100]}")
        return False
    except Exception as e:
        print(f"      ⚠️ Exception: {e}")
        return False

def delete_product_recursive(product):
    product_href = product["meta"]["href"]
    product_name = product.get("name", "Unknown")
    
    for attempt in range(5):
        try:
            resp = requests.delete(product_href, auth=auth, timeout=10)
            if resp.status_code in [200, 204, 404]:
                print(f"✅ Deleted: {product_name}")
                return True
                
            if resp.status_code == 429:
                print("      ⏳ 429. Sleeping 5s...")
                time.sleep(5)
                continue

            error_data = resp.json()
            errors = error_data.get("errors", [])
            
            dependency_found = False
            for err in errors:
                if err.get("code") == 1028 and "dependencies" in err:
                    for dep in err["dependencies"]:
                        if delete_dependency(dep.get("href")):
                            dependency_found = True
            
            if not dependency_found:
                print(f"❌ Failed {product_name}: {resp.status_code} {resp.text[:100]}")
                return False
                
            time.sleep(0.5)
        except Exception as e:
            print(f"❌ Exception for {product_name}: {e}")
            time.sleep(1)
            
    return False

def fetch_targets():
    print("📋 Fetching targets...")
    all_targets = []
    offset = 0
    limit = 1000
    
    while True:
        url = f"{BASE_URL}/entity/product?limit={limit}&offset={offset}&expand=productFolder"
        resp = requests.get(url, auth=auth, timeout=30)
        if not resp.ok: 
            print(f"Error fetching batch: {resp.status_code}")
            break
        
        data = resp.json()
        rows = data.get("rows", [])
        
        for p in rows:
            folder = p.get("productFolder", {})
            folder_href = folder.get("meta", {}).get("href", "")
            if TARGET_FOLDER_ID in folder_href:
                all_targets.append(p)
        
        print(f"   Scanned {offset + len(rows)} / {data['meta']['size']} - Found {len(all_targets)} targets")
        
        if len(rows) < limit or (offset + len(rows)) >= data['meta']['size']:
            break
        offset += limit
            
    return all_targets

if __name__ == "__main__":
    targets = fetch_targets()
    print(f"🚀 Starting cleanup of {len(targets)} targets...")
    count = 0
    for p in targets:
        count += 1
        delete_product_recursive(p)
        if count % 10 == 0:
            print(f"Progress: {count}/{len(targets)}")
