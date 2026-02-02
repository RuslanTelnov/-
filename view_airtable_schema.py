import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("AIRTABLE_API_KEY")
BASE_ID = "appitxCGjgmiW2zLX"
TABLE_NAME = "Products"

def get_table_schema():
    headers = {"Authorization": f"Bearer {API_KEY}"}
    url = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        tables = response.json().get("tables", [])
        for table in tables:
            if table['name'] == TABLE_NAME:
                print(f"Схема таблицы '{TABLE_NAME}':")
                for field in table['fields']:
                    print(f" - {field['name']} ({field['type']})")
                return
    print(f"Таблица '{TABLE_NAME}' не найдена в метаданных.")

if __name__ == "__main__":
    get_table_schema()
