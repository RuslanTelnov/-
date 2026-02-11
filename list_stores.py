import os, requests, base64
from dotenv import load_dotenv

load_dotenv("temp_tlnv_parser/moysklad-web/.env.local")
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
auth = base64.b64encode(f"{LOGIN}:{PASSWORD}".encode()).decode()
headers = {"Authorization": f"Basic {auth}"}
r = requests.get("https://api.moysklad.ru/api/remap/1.2/entity/store", headers=headers)
stores = r.json().get("rows", [])
for s in stores:
    print(f"{s.get('name')}: {s.get('id')}")
