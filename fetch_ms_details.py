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

def get_store_id(name="Склад ВБ"):
    resp = requests.get(f"{BASE_URL}/entity/store", auth=auth)
    if resp.ok:
        for store in resp.json().get('rows', []):
            if store['name'] == name:
                return store['id']
    return None

def fetch_positive_stock_products(store_name="Склад ВБ"):
    store_id = get_store_id(store_name)
    if not store_id:
        print(f"❌ Store '{store_name}' not found.")
        return []

    print(f"🔍 Fetching products with positive stock on '{store_name}'...")
    # Use stock/bycollection as it's often more reliable for filtering
    # Or just stock/all with a larger timeout
    url = f"{BASE_URL}/report/stock/all?filter=stockMode=positiveOnly&store.id={store_id}&limit=1000"
    
    try:
        resp = requests.get(url, auth=auth, timeout=60)
        if resp.ok:
            rows = resp.json().get('rows', [])
            print(f"✅ Found {len(rows)} candidates.")
            return rows
        else:
            print(f"❌ Error: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")
    return []

def get_product_details(product_href):
    """Fetch full product details including images and description."""
    # Expand images to get URLs
    resp = requests.get(f"{product_href}?expand=images", auth=auth)
    if resp.ok:
        return resp.json()
    return None

def sync_to_kaspi():
    from temp_tlnv_parser.velveto_app.automation.kaspi.create_from_wb import create_card
    # We will need to adapt create_card or use its logic
    # Actually, let's create a specialized sync_ms_to_kaspi function
    pass

if __name__ == "__main__":
    candidates = fetch_positive_stock_products()
    if candidates:
        # Show first 5 with details
        for i, item in enumerate(candidates[:5]):
            details = get_product_details(item['meta']['href'])
            if details:
                images = details.get('images', {}).get('rows', [])
                img_count = len(images)
                desc = details.get('description', 'No description')
                print(f"{i+1}. {item['name']} | Images: {img_count} | Desc length: {len(desc)}")
