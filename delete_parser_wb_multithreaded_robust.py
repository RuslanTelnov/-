import os
import requests
import json
import time
import random
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

def request_with_backoff(method, url, **kwargs):
    """Effectively handles 429 errors with exponential backoff."""
    retries = 0
    max_retries = 10
    base_delay = 1.0
    
    while retries < max_retries:
        try:
            resp = requests.request(method, url, **kwargs)
            if resp.status_code == 429:
                delay = base_delay * (2 ** retries) + random.uniform(0, 1)
                # safe_print(f"      ⏳ Rate limit hit. Sleeping {delay:.2f}s...")
                time.sleep(delay)
                retries += 1
                continue
            return resp
        except Exception as e:
            safe_print(f"      ⚠️ Request exception: {e}")
            retries += 1
            time.sleep(1)
            
    return None

def delete_dependency(dependency_href):
    """Deletes a dependency object by its HREF."""
    resp = request_with_backoff("DELETE", dependency_href, auth=auth)
    if resp and resp.status_code in [200, 204]:
        # safe_print(f"      ✅ Dependency deleted.")
        return True
    elif resp and resp.status_code == 404:
        return True 
    else:
        # safe_print(f"      ❌ Failed to delete dep: {resp.status_code if resp else 'No Resp'}")
        return False

def delete_product_recursive(product):
    """Attempts to delete a product. If blocked by dependencies, deletes them and retries."""
    product_href = product["meta"]["href"]
    product_name = product.get("name", "Unknown")
    
    max_logical_retries = 5
    for attempt in range(max_logical_retries):
        resp = request_with_backoff("DELETE", product_href, auth=auth)
        
        if not resp:
            safe_print(f"❌ Failed {product_name}: Network/Auth Error")
            return False
            
        if resp.status_code in [200, 204] or resp.status_code == 404:
            safe_print(f"✅ Deleted: {product_name}")
            return True
            
        try:
            error_data = resp.json()
            errors = error_data.get("errors", [])
        except:
            errors = []
        
        dependency_found = False
        for err in errors:
            if err.get("code") == 1028 and "dependencies" in err:
                for dep in err["dependencies"]:
                    dep_href = dep.get("href")
                    if dep_href:
                        if delete_dependency(dep_href):
                            dependency_found = True
        
        if not dependency_found:
            safe_print(f"❌ Failed {product_name}: {resp.status_code}")
            return False
            
        # If we cleaned up dependencies, retry
        # safe_print(f"   🔄 Retrying {product_name}...")
        time.sleep(0.1) 
        
    return False

def fetch_all_targets():
    safe_print("📋 Fetching targets...")
    all_targets = []
    offset = 0
    limit = 1000
    
    while True:
        url = f"{BASE_URL}/entity/product?limit={limit}&offset={offset}&expand=productFolder"
        resp = request_with_backoff("GET", url, auth=auth)
        if not resp or not resp.ok: 
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
            
    return all_targets

def main():
    targets = fetch_all_targets()
    if not targets:
        safe_print("ℹ️ No products found to delete.")
        return

    safe_print(f"🚀 Starting cleanup of {len(targets)} products with 5 threads (Robust Mode)...")
    
    # 5 Workers is safer for rate limits
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(delete_product_recursive, p) for p in targets]
        
        completed = 0
        total = len(targets)
        for f in futures:
            try:
                f.result()
            except Exception:
                pass
            
            completed += 1
            if completed % 50 == 0:
                safe_print(f"📉 Progress: {completed}/{total} ({completed/total*100:.1f}%)")

    safe_print("🏁 Cleanup complete.")

if __name__ == "__main__":
    main()
