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

def debug():
    resp = requests.get(f"{BASE_URL}/entity/product?limit=1", auth=auth)
    if resp.ok:
        print(json.dumps(resp.json()["rows"][0], indent=2, ensure_ascii=False))
    else:
        print(f"Error: {resp.status_code} {resp.text}")

if __name__ == "__main__":
    debug()
