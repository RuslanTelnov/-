import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def create_supplier(name):
    # Check if exists
    url = f"{BASE_URL}/entity/counterparty?filter=name={name}"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        rows = resp.json().get('rows', [])
        if rows:
            print(f"✅ Supplier '{name}' already exists")
            return rows[0]

    # Create
    data = {"name": name}
    resp = requests.post(f"{BASE_URL}/entity/counterparty", json=data, headers=HEADERS)
    if resp.status_code == 200:
        print(f"✅ Created supplier '{name}'")
        return resp.json()
    else:
        print(f"❌ Failed to create supplier: {resp.text}")
        return None

if __name__ == "__main__":
    create_supplier('ООО "Поставщик"')
