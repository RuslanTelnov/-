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

def list_folders():
    resp = requests.get(f"{BASE_URL}/entity/productfolder", auth=auth)
    if resp.ok:
        folders = resp.json().get("rows", [])
        for f in folders:
            print(f"- {f.get('name')} (ID: {f.get('id')})")
    else:
        print(f"Error: {resp.status_code} {resp.text}")

if __name__ == "__main__":
    list_folders()
