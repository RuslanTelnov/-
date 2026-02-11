import os
from dotenv import load_dotenv
from supabase import create_client

# Load env
load_dotenv("/home/wik/wb-kaspi-dashboard/moysklad-web/.env.local")

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

def check_all_statuses():
    print(f"📊 Detailed Status Stats for {url}:")
    statuses = ['done', 'idle', 'error', 'processing']
    total_found = 0
    for s in statuses:
        count = supabase.schema('Parser').table('wb_search_results').select('id', count='exact').eq('conveyor_status', s).execute().count
        print(f"- {s}: {count}")
        total_found += count
    
    # Check null
    null_count = supabase.schema('Parser').table('wb_search_results').select('id', count='exact').is_('conveyor_status', 'null').execute().count
    print(f"- None (null): {null_count}")
    total_found += null_count
    
    total = supabase.schema('Parser').table('wb_search_results').select('id', count='exact').execute().count
    print(f"Total: {total}")
    print(f"Sum of parts: {total_found}")

if __name__ == "__main__":
    check_all_statuses()
