import os
import requests
import json
from dotenv import load_dotenv

env_path = os.path.join(os.getcwd(), "temp_tlnv_parser", "velveto-app", ".env.local")
load_dotenv(env_path)

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth = (LOGIN, PASSWORD)

def find_folder():
    print("🔍 Searching for 'Parser WB' folder...")
    resp = requests.get(f"{BASE_URL}/entity/productfolder", auth=auth)
    if not resp.ok:
        print(f"Error: {resp.status_code} {resp.text}")
        return

    folders = resp.json().get("rows", [])
    found = False
    for f in folders:
        if "Parser" in f["name"]:
            print(f"- Found matching folder: '{f['name']}' (ID: {f['id']})")
            found = True
    
    if not found:
        print("❌ No folder containing 'Parser' found in the first 1000 rows.")

if __name__ == "__main__":
    find_folder()
