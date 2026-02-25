import os
import sys
import json
import time
from typing import List, Dict, Any
import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv

# Try different .env locations
env_paths = [
    ".env.local",
    "temp_tlnv_parser/velveto-app/.env.local",
    ".env"
]
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        print(f"Loaded {path}")
        break

def fetch_ms_candidates(store_name="Склад ВБ"):
    """Fetches products with positive stock from MS."""
    login = os.getenv("MOYSKLAD_LOGIN")
    password = os.getenv("MOYSKLAD_PASSWORD")
    base_url = "https://api.moysklad.ru/api/remap/1.2"
    auth = HTTPBasicAuth(login, password)
    
    if not login or not password:
        print("Missing MS credentials")
        return []

    # Get Store ID
    print(f"Fetching Store ID for '{store_name}'...")
    store_id = None
    resp = requests.get(f"{base_url}/entity/store", auth=auth)
    if resp.ok:
        for store in resp.json().get('rows', []):
            if store['name'] == store_name:
                store_id = store['id']
                break
    
    if not store_id:
        print(f"Store '{store_name}' not found.")
        return []

    print(f"Fetching stock report for store {store_id}...")
    url = f"{base_url}/report/stock/all"
    params = {
        "filter": "stockMode=positiveOnly",
        "store.id": store_id,
        "limit": 1000
    }
    
    try:
        response = requests.get(url, auth=auth, params=params)
        response.raise_for_status()
        data = response.json()
        
        candidates = []
        for item in data.get('rows', []):
            candidates.append({
                "article": item.get('article'),
                "name": item.get('name'),
                "code": item.get('code'),
                "price": item.get('price', 0),
                "stock": item.get('stock', 0)
            })
        return candidates
    except Exception as e:
        print(f"Error fetching stock: {e}")
        return []

if __name__ == "__main__":
    candidates = fetch_ms_candidates()
    print(f"Found {len(candidates)} candidates.")
    with open("ms_candidates_export.json", "w", encoding="utf-8") as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2)
    print("Exported to ms_candidates_export.json")
