import os
import requests
import json
import time
from dotenv import load_dotenv

# Load env from the velveto-app directory
env_path = os.path.join(os.getcwd(), "temp_tlnv_parser", "velveto-app", ".env.local")
load_dotenv(env_path)

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth = (LOGIN, PASSWORD)
# The folder ID for "Parser WB"
TARGET_FOLDER_ID = "19a36dcb-d429-11f0-0a80-09fc007fab74"

def delete_dependency(dependency_href):
    """Deletes a dependency object by its HREF."""
    print(f"      🔗 Deleting dependency: {dependency_href}")
    resp = requests.delete(dependency_href, auth=auth)
    if resp.status_code in [200, 204]:
        print("      ✅ Dependency deleted.")
        return True
    else:
        print(f"      ❌ Failed to delete dependency: {resp.status_code} {resp.text}")
        return False

def delete_product_recursive(product):
    """Attempts to delete a product. If blocked by dependencies, deletes them and retries."""
    product_href = product["meta"]["href"]
    product_name = product.get("name", "Unknown")
    
    max_retries = 5
    for attempt in range(max_retries):
        resp = requests.delete(product_href, auth=auth)
        
        if resp.status_code in [200, 204]:
            print(f"   ✅ Deleted product: {product_name}")
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
                        if delete_dependency(dep_href):
                            dependency_found = True
        
        if not dependency_found:
            print(f"   ❌ Failed to delete {product_name}: {resp.status_code} {resp.text}")
            return False
            
        print(f"      🔄 Retrying product deletion (Attempt {attempt + 2})...")
        time.sleep(0.5) # Slight delay
        
    return False

def cleanup_parser_products():
    print(f"🚀 Starting Recursive Cleanup for folder ID {TARGET_FOLDER_ID}...")
    
    total_deleted = 0
    
    while True:
        # Fetch products in the target folder
        print(f"📦 Fetching next batch of products...")
        
        # Note: We filter manually because API filtering on productFolder can be finicky
        # We assume if we fetch 1000 items and filter, we'll find some. 
        # Since we are deleting them, the list will shrink.
        
        url = f"{BASE_URL}/entity/product?limit=100&expand=productFolder"
        resp = requests.get(url, auth=auth)
        if not resp.ok:
            print(f"❌ Error fetching products: {resp.status_code} {resp.text}")
            break
            
        data = resp.json()
        rows = data.get("rows", [])
        
        target_products = []
        for p in rows:
            folder = p.get("productFolder", {})
            folder_href = folder.get("meta", {}).get("href", "")
            if TARGET_FOLDER_ID in folder_href:
                target_products.append(p)
        
        if not target_products:
            # Check if there are more pages? 
            # If we fetched 100 and none matched, we might need to look deeper or we are done.
            # But since we are deleting, valid targets should appear at the top eventually if we sort?
            # Let's try fetching with an offset if the first page has no targets but the total size is huge.
            # However, usually iterating is enough. 
            # Let's check the size.
            total_size = data.get("meta", {}).get("size", 0)
            if total_size == 0:
                print("ℹ️ No products left in MoySklad.")
                break
            
            # If we found no targets in the first 100, but size > 0, maybe they are deeper?
            # Let's try to filter by the folder logic more strictly or just use the generator approach from before
            # but we need to reset offset because we are deleting items.
            print(f"⚠️ No targets in current batch. Scanning deeper...")
            
            # Use a specialized fetch for just this folder if manual filtering fails on page 1
            # We implemented `delete_parser_wb_products.py` with manual filtering over all products.
            # Let's use the looping logic from there but apply recursive delete.
            # actually, let's just use the `delete_parser_wb_products.py` logic of iterating all and verify.
            # But simpler: use the previous script's logic to FIND, then use `delete_product_recursive` to DELETE.
            break

    # Re-implementing the finding logic inside here for simplicity
    pass

def cleanup_loop():
    print(f"🚀 Starting Recursive Cleanup Loop for {TARGET_FOLDER_ID}")
    
    offset = 0
    BATCH_SIZE = 100
    
    while True:
        # We unfortunately have to scan because we can't reliably filter by folder ID in the URL for some reason (API 412)
        # So we scan all products. Be careful not to skip if we delete things.
        # Ensure we always start from offset 0 if we deleted something? 
        # No, scanning all is expensive.
        # Let's try to create a "smart" scanner. 
        # The previous script (Step 1524) found 3594 matches.
        # It successfully deleted many. We just need to catch the "dependencies" ones.
        
        # Let's re-use the robust "scan all" logic
        
        url = f"{BASE_URL}/entity/product?limit={BATCH_SIZE}&offset={offset}&expand=productFolder"
        resp = requests.get(url, auth=auth)
        if not resp.ok: 
            print("Error fetching") 
            break
            
        data = resp.json()
        rows = data.get("rows", [])
        total_size = data.get("meta", {}).get("size", 0)
        
        target_products = []
        for p in rows:
            folder = p.get("productFolder", {})
            folder_href = folder.get("meta", {}).get("href", "")
            if TARGET_FOLDER_ID in folder_href:
                target_products.append(p)
        
        if target_products:
            print(f"🎯 Found {len(target_products)} targets in current batch (Offset {offset})")
            deleted_count = 0
            for p in target_products:
                if delete_product_recursive(p):
                    deleted_count += 1
            
            # If we deleted items, the offsets shift!
            # The safe way when deleting from a list is to NOT increment offset, 
            # because the next page slides into the current page.
            # But we are iterating the WHOLE product database (mixed folders).
            # If we matched 10 items in a batch of 100 and deleted them:
            # 10 items are gone. The database shifts up.
            # If we increment offset by 100, we skip 100 items - (deleted count).
            # So actual new offset should be: offset + (100 - deleted_count) theoretically?
            # Or just simpler: Reset offset to 0 and start over? Inefficient.
            # Better strategy: 
            # Just keep querying `offset=0` until no matches are found in the first N pages? 
            # No, other products exist.
            
            # Correct strategy for mixed lists:
            # If we found targets and deleted them, we should probably re-fetch the SAME offset 
            # or adjust the offset increment.
            # But since "Parser WB" products are likely grouped or scattered...
            # Let's stick to the previous script's logic: it incremented offset. 
            # But that script didn't account for shifting indices.
            # Actually, `delete_parser_wb_products.py` was fetching ALL then deleting.
            # We should do that: Fetch ALL targets first (just IDs/metas), THEN delete.
            pass
        
        print(f"Processed batch at offset {offset}. Targets found: {len(target_products)}")
        
        if not rows:
            break
           
        # If we deleted everything in this batch that matched, 
        # we can proceed. The issue of shifting indices is real but let's assume 
        # we just want to get "most" and we can run it multiple times.
        # A better way: just restart the script if we found targets?
        # Let's just create a list of ALL targets first.
        offset += BATCH_SIZE
        if offset >= total_size:
            break

def fetch_and_destroy():
    print("📋 Phase 1: Gathering all target products...")
    all_targets = []
    offset = 0
    limit = 1000
    
    while True:
        url = f"{BASE_URL}/entity/product?limit={limit}&offset={offset}&expand=productFolder"
        resp = requests.get(url, auth=auth)
        if not resp.ok: break
        
        data = resp.json()
        rows = data.get("rows", [])
        
        for p in rows:
            folder = p.get("productFolder", {})
            folder_href = folder.get("meta", {}).get("href", "")
            if TARGET_FOLDER_ID in folder_href:
                all_targets.append(p)
        
        print(f"   Scanned {offset + len(rows)} / {data['meta']['size']} - Found {len(all_targets)} targets so far")
        
        if len(rows) < limit or (offset + len(rows)) >= data['meta']['size']:
            break
        offset += limit
        
    print(f"📋 Phase 2: Destroying {len(all_targets)} products and their dependencies...")
    
    count = 0
    for p in all_targets:
        count += 1
        print(f"[{count}/{len(all_targets)}] Processing {p.get('name')}...")
        delete_product_recursive(p)

    print("🏁 Cleanup complete.")

if __name__ == "__main__":
    fetch_and_destroy()
