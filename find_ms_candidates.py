import os
import requests
import json
from dotenv import load_dotenv

# Load env from the root directory
env_path = os.path.join(os.getcwd(), ".env")
load_dotenv(env_path)

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth = (LOGIN, PASSWORD)

def get_store_id(name):
    url = f"{BASE_URL}/entity/store"
    resp = requests.get(url, auth=auth)
    if resp.ok:
        for store in resp.json().get('rows', []):
            if store['name'] == name:
                return store['id']
    return None

def find_candidates():
    store_name = "Склад ВБ"
    store_id = get_store_id(store_name)
    if not store_id:
        print(f"❌ Store '{store_name}' not found.")
        return

    print(f"🔍 Fetching stock for store '{store_name}' ({store_id})...")
    
    # Get stock report for the specific store
    stock_url = f"{BASE_URL}/report/stock/all?filter=stockMode=positiveOnly&store.id={store_id}&limit=1000"
    resp = requests.get(stock_url, auth=auth)
    
    if not resp.ok:
        print(f"❌ Error fetching stock: {resp.status_code} {resp.text}")
        return

    rows = resp.json().get('rows', [])
    print(f"📦 Found {len(rows)} products with positive stock on '{store_name}'.")
    
    # Sample some products
    for i, item in enumerate(rows[:10]):
        product_name = item.get('name')
        stock = item.get('stock')
        code = item.get('code')
        article = item.get('article')
        print(f"{i+1}. {product_name} | SKU: {code}/{article} | Stock: {stock}")

if __name__ == "__main__":
    find_candidates()
