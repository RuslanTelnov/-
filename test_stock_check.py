import os
import sys
from dotenv import load_dotenv

# Setup path to point to the web automation folder
sys.path.append('/home/wik/antigravity/scratch/moysklad-web/automation/moysklad')

import oprihodovanie

if __name__ == "__main__":
    print(f"Listing first 5 products to test stock check...")
    try:
        url = f"{oprihodovanie.BASE_URL}/entity/product?limit=5"
        resp = oprihodovanie.requests.get(url, headers=oprihodovanie.HEADERS)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            for row in rows:
                print(f"--- Product: {row['name']} ({row['id']}) ---")
                stock = oprihodovanie.get_total_stock(row['id'])
                print(f"Total Stock: {stock}")
        else:
            print(f"Error fetching products: {resp.status_code}")

    except Exception as e:
        print(f"Error: {e}")
