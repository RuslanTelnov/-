import os
import base64
import requests
from dotenv import load_dotenv

# Load settings
load_dotenv()
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

# Authorization
auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def get_warehouse_id(name):
    """Find warehouse ID by name"""
    url = f"{BASE_URL}/entity/store?filter=name={name}"
    try:
        resp = requests.get(url, headers=HEADERS)
        resp.raise_for_status()
        data = resp.json()
        if data.get('rows'):
            return data['rows'][0]['id']
    except Exception as e:
        print(f"❌ Error searching for warehouse '{name}': {e}")
    return None

def get_enters_by_warehouse(warehouse_id):
    """Get all 'enter' documents for a specific warehouse"""
    # Note: MoySklad API for 'enter' documents supports filtering by store
    # We need to filter by store link
    store_href = f"{BASE_URL}/entity/store/{warehouse_id}"
    url = f"{BASE_URL}/entity/enter?filter=store={store_href}"
    
    documents = []
    try:
        while url:
            resp = requests.get(url, headers=HEADERS)
            resp.raise_for_status()
            data = resp.json()
            documents.extend(data.get('rows', []))
            
            # Pagination
            url = data.get('meta', {}).get('nextHref')
            
    except Exception as e:
        print(f"❌ Error getting documents: {e}")
    return documents


def delete_enters_bulk(enters_batch):
    """Delete a batch of 'enter' documents"""
    url = f"{BASE_URL}/entity/enter/delete"
    try:
        # Prepare body: list of objects with just meta
        body = [{"meta": enter["meta"]} for enter in enters_batch]
        
        resp = requests.post(url, json=body, headers=HEADERS)
        resp.raise_for_status()
        print(f"✅ Deleted batch of {len(enters_batch)} documents")
        return True
    except Exception as e:
        print(f"❌ Error deleting batch: {e}")
        return False

def main():
    warehouse_name = "Склад ВБ"
    print(f"🔍 Searching for warehouse: {warehouse_name}...")
    
    warehouse_id = get_warehouse_id(warehouse_name)
    if not warehouse_id:
        print(f"❌ Warehouse '{warehouse_name}' not found!")
        return

    print(f"✅ Warehouse found. ID: {warehouse_id}")
    

def count_enters(warehouse_id):
    store_href = f"{BASE_URL}/entity/store/{warehouse_id}"
    url = f"{BASE_URL}/entity/enter?filter=store={store_href}&limit=1"
    try:
        resp = requests.get(url, headers=HEADERS)
        resp.raise_for_status()
        data = resp.json()
        return data.get('meta', {}).get('size', 0)
    except Exception as e:
        return -1

def main():
    warehouse_name = "Склад ВБ"
    print(f"🔍 Searching for warehouse: {warehouse_name}...")
    
    warehouse_id = get_warehouse_id(warehouse_name)
    if not warehouse_id:
        print(f"❌ Warehouse '{warehouse_name}' not found!")
        return

    print(f"✅ Warehouse found. ID: {warehouse_id}")
    
    initial_count = count_enters(warehouse_id)
    print(f"📊 Total documents to delete: {initial_count}")
    
    deleted_total = 0
    while True:
        # Get one page (100 items)
        store_href = f"{BASE_URL}/entity/store/{warehouse_id}"
        url = f"{BASE_URL}/entity/enter?filter=store={store_href}&limit=100"
        
        try:
            resp = requests.get(url, headers=HEADERS)
            resp.raise_for_status()
            data = resp.json()
            enters = data.get('rows', [])
        except Exception as e:
            print(f"❌ Error getting documents: {e}")
            break
            
        if not enters:
            print("ℹ️ No more documents found.")
            break
            
        count = len(enters)
        if delete_enters_bulk(enters):
            deleted_total += count
            remaining = initial_count - deleted_total
            print(f"   Deleted: {deleted_total} | Remaining (est): {max(0, remaining)}")
        else:
            print("⚠️ Failed to delete batch, stopping.")
            break
            
    print("="*30)
    print(f"🏁 Finished! Total deleted: {deleted_total}")

if __name__ == "__main__":
    main()
