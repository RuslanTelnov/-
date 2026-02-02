import os
import requests
import json
import sys
from supabase import create_client
from dotenv import load_dotenv

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import config

# Load env from moysklad-automation (where Supabase creds are)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "moysklad-automation", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Supabase credentials not found.")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_zero_stock_products():
    """Fetch products with stock = 0 from Supabase."""
    print("Fetching zero-stock products from Supabase...")
    try:
        # Fetching all for now, can paginate if needed
        res = supabase.table('products').select("article, stock").eq("stock", 0).execute()
        return res.data
    except Exception as e:
        print(f"Error fetching from Supabase: {e}")
        return []

def update_kaspi_availability(products):
    """Send updates to Kaspi."""
    if not products:
        print("No products to update.")
        return

    print(f"Preparing to update {len(products)} products on Kaspi...")
    
    payloads = []
    for p in products:
        sku = p.get("article")
        if not sku:
            continue
            
        # Construct payload
        # Note: 'availability' might need to be 'available': 'no' or similar.
        # Based on common APIs, we'll try "availability": "no"
        item = {
            "sku": sku,
            "availability": "no" 
        }
        payloads.append(item)

    # Batch send (Kaspi might have limits, let's do chunks of 100)
    chunk_size = 100
    url = f"{config.KASPI_MERCHANT_API_URL}/products/import"
    headers = {
        "Content-Type": "application/json",
        "X-Auth-Token": config.KASPI_API_TOKEN,
        "User-Agent": config.USER_AGENT
    }

    for i in range(0, len(payloads), chunk_size):
        chunk = payloads[i:i+chunk_size]
        print(f"Sending chunk {i}-{i+len(chunk)}...")
        
        try:
            response = requests.post(url, json=chunk, headers=headers)
            if response.status_code in [200, 201, 202, 204]:
                print("✅ Success")
            else:
                print(f"❌ Failed: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error sending request: {e}")

if __name__ == "__main__":
    zero_stock_products = get_zero_stock_products()
    if zero_stock_products:
        print(f"Found {len(zero_stock_products)} products with 0 stock.")
        update_kaspi_availability(zero_stock_products)
    else:
        print("No zero-stock products found.")
