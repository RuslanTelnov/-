import os
from dotenv import load_dotenv
from supabase import create_client
import json

# Load env
load_dotenv("/home/wik/wb-kaspi-dashboard/moysklad-web/.env.local")

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

def migrate():
    print(f"🔄 Starting migration from 'products' to 'wb_search_results'...")
    
    # 1. Get all articles from wb_search_results to avoid duplicates
    # Use a loop to get ALL IDs if > 1000
    existing_ids = set()
    offset = 0
    while True:
        res = supabase.schema('Parser').table('wb_search_results').select('id').range(offset, offset + 999).execute()
        if not res.data:
            break
        for item in res.data:
            existing_ids.add(str(item['id']))
        offset += 1000
    
    print(f"Found {len(existing_ids)} existing items in wb_search_results.")

    # 2. Fetch all from products
    batch_size = 1000
    offset = 0
    to_migrate = []

    while True:
        res = supabase.schema('Parser').table('products').select('*').range(offset, offset + batch_size - 1).execute()
        if not res.data:
            break
        
        for p in res.data:
            article_raw = str(p.get('article', ''))
            # Sanitize: some might be '123.0' or other junk
            article = article_raw.split('.')[0]
            if not article.isdigit():
                continue

            if article not in existing_ids:
                ms_created = True if p.get('moysklad_id') else False
                
                to_migrate.append({
                    "id": int(article),
                    "name": p.get('name'),
                    "price_kzt": p.get('price'),
                    "image_url": p.get('image_url'),
                    "brand": p.get('brand'),
                    "ms_created": ms_created,
                    "conveyor_status": "idle",
                    "specs": {
                        "from_migration": True,
                        "original_code": p.get('code')
                    }
                })
        
        offset += batch_size
        print(f"Scanned {offset} products from 'products' table...")

    print(f"Identified {len(to_migrate)} new products to migrate.")

    # 3. Insert into wb_search_results in batches
    if to_migrate:
        success_count = 0
        for i in range(0, len(to_migrate), 100):
            batch = to_migrate[i:i+100]
            try:
                supabase.schema('Parser').table('wb_search_results').upsert(batch).execute()
                success_count += len(batch)
                print(f"Migrated batch {i//100 + 1}/{(len(to_migrate)-1)//100 + 1} ({success_count}/{len(to_migrate)})")
            except Exception as e:
                print(f"Error migrating batch: {e}")

    print(f"✅ Migration complete. Total migrated: {len(to_migrate)}")

if __name__ == "__main__":
    migrate()
