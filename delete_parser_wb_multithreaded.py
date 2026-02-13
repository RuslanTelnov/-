import os
import requests
import json
import time
from concurrent.futures import ThreadPoolExecutor
from threading import Lock
from dotenv import load_dotenv

# Load env from the velveto-app directory
env_path = os.path.join(os.getcwd(), "temp_tlnv_parser", "velveto-app", ".env.local")
load_dotenv(env_path)

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth = (LOGIN, PASSWORD)
TARGET_FOLDER_ID = "19a36dcb-d429-11f0-0a80-09fc007fab74"

print_lock = Lock()

def safe_print(msg):
    with print_lock:
        print(msg)

def delete_dependency(dependency_href):
    """Deletes a dependency object by its HREF."""
    try:
        resp = requests.delete(dependency_href, auth=auth)
        if resp.status_code in [200, 204]:
            # safe_print(f"      ✅ Dependency deleted: {dependency_href}")
            return True
        elif resp.status_code == 404:
            return True # Already deleted
        else:
            safe_print(f"      ❌ Failed to delete dependency: {resp.status_code} {resp.text}")
            return False
    except Exception as e:
        safe_print(f"      ⚠️ Exception deleting dependency: {e}")
        return False

def delete_product_recursive(product):
    """Attempts to delete a product. If blocked by dependencies, deletes them and retries."""
    product_href = product["meta"]["href"]
    product_name = product.get("name", "Unknown")
    
    max_retries = 5
    for attempt in range(max_retries):
        try:
            resp = requests.delete(product_href, auth=auth)
            
            if resp.status_code in [200, 204] or resp.status_code == 404:
                safe_print(f"✅ Deleted: {product_name}")
                return True
                
            error_data = resp.json()
            errors = error_data.get("errors", [])
            
            dependency_found = False
            for err in errors:
                # Code 1028: Object is in use
                if err.get("code") == 1028 and "dependencies" in err:
                    for dep in err["dependencies"]:
                        dep_href = dep.get("href")
                        if dep_href:
                            dep_deleted = delete_dependency(dep_href)
                            if dep_deleted:
                                dependency_found = True
            
            if not dependency_found:
                safe_print(f"❌ Failed {product_name}: {resp.status_code}")
                return False
                
            # If we cleaned up dependencies, retry
            # safe_print(f"   🔄 Retrying {product_name}...")
            time.sleep(0.2) 
        except Exception as e:
             safe_print(f"⚠️ Exception processing {product_name}: {e}")
             return False
        
    return False

def fetch_all_targets():
    safe_print("📋 Fetching all target products...")
    all_targets = []
    offset = 0
    limit = 1000
    
    while True:
        try:
            url = f"{BASE_URL}/entity/product?limit={limit}&offset={offset}&expand=productFolder"
            resp = requests.get(url, auth=auth)
            if not resp.ok: 
                safe_print(f"Error fetching: {resp.status_code}")
                break
            
            data = resp.json()
            rows = data.get("rows", [])
            
            for p in rows:
                folder = p.get("productFolder", {})
                folder_href = folder.get("meta", {}).get("href", "")
                if TARGET_FOLDER_ID in folder_href:
                    all_targets.append(p)
            
            safe_print(f"   Scanned {offset + len(rows)} / {data['meta']['size']} - Found {len(all_targets)} so far")
            
            if len(rows) < limit or (offset + len(rows)) >= data['meta']['size']:
                break
            offset += limit
        except Exception as e:
            safe_print(f"Error fetching: {e}")
            break
            
    return all_targets

def main():
    targets = fetch_all_targets()
    if not targets:
        safe_print("ℹ️ No products found to delete.")
        return

    safe_print(f"🚀 Starting cleanup of {len(targets)} products with 10 threads...")
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(delete_product_recursive, p) for p in targets]
        
        # Monitor progress
        completed = 0
        total = len(targets)
        for f in futures:
            # We don't necessarily need to wait for result here if we just want to count
            # but getting result handles exceptions
            try:
                f.result()
            except Exception as e:
                safe_print(f"Thread error: {e}")
            
            completed += 1
            if completed % 50 == 0:
                safe_print(f"📉 Progress: {completed}/{total} ({completed/total*100:.1f}%)")

    safe_print("🏁 Cleanup complete.")

if __name__ == "__main__":
    main()
