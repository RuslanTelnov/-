import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("AIRTABLE_API_KEY")
BASE_URL = "https://api.airtable.com/v0/meta/bases"

def list_bases():
    headers = {"Authorization": f"Bearer {API_KEY}"}
    response = requests.get(BASE_URL, headers=headers)
    if response.status_code == 200:
        bases = response.json().get("bases", [])
        print(f"Найдено баз: {len(bases)}")
        for base in bases:
            print(f"ID: {base['id']} | Name: {base['name']}")
            list_tables(base['id'])
    else:
        print(f"Ошибка при получении списка баз: {response.status_code}")
        print(response.text)

def list_tables(base_id):
    headers = {"Authorization": f"Bearer {API_KEY}"}
    url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        tables = response.json().get("tables", [])
        for table in tables:
            print(f"  - Table: {table['name']} (ID: {table['id']})")
    else:
        print(f"  - Ошибка получения таблиц для {base_id}: {response.status_code}")

if __name__ == "__main__":
    list_bases()
