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
TARGET_ID = "409173f1-0273-11f1-0a80-04fa001125ec"

def inspect():
    url = f"{BASE_URL}/entity/enter/{TARGET_ID}"
    resp = requests.get(url, auth=auth)
    if resp.ok:
        print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
    else:
        print(f"Error: {resp.status_code} {resp.text}")

if __name__ == "__main__":
    inspect()
