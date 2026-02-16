import os
from supabase import create_client, Client
from dotenv import load_dotenv

def fix_moderation_status():
    load_dotenv()
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    supabase = create_client(url, key)

    print("🔍 Fetching products with kaspi_created=True and empty kaspi_status...")
    
    # Fetch records where kaspi_created is True but kaspi_status is either 'pending' or NULL
    res = supabase.schema('Parser').table('wb_search_results') \
        .select("id, specs") \
        .eq("kaspi_created", True) \
        .execute()

    if not res.data:
        print("✅ No products found needing a fix.")
        return

    count = 0
    for item in res.data:
        article_id = item['id']
        specs = item.get('specs', {})
        
        # Determine status from specs if present, otherwise default to 'moderation'
        status = specs.get('kaspi_status', 'moderation')
        
        print(f"🔄 Updating ID {article_id} to status '{status}'")
        supabase.schema('Parser').table('wb_search_results') \
            .update({"kaspi_status": status}) \
            .eq("id", article_id) \
            .execute()
        count += 1

    print(f"🎉 Successfully fixed {count} records.")

if __name__ == "__main__":
    fix_moderation_status()
