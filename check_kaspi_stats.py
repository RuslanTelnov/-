
import os
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv('temp_tlnv_parser/velveto-app/.env.local')
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("Missing Supabase credentials")
    exit(1)

supabase = create_client(url, key)

try:
    # Check products created in Kaspi today (UTC)
    today = datetime.utcnow().strftime('%Y-%m-%d')
    res = supabase.schema('Parser').table('wb_search_results').select('id, name, updated_at') \
        .eq('kaspi_created', True) \
        .gte('updated_at', today) \
        .order('updated_at', desc=True) \
        .execute()
    
    print(f"Products created on Kaspi today: {len(res.data)}")
    for p in res.data[:10]:
        print(f"✅ {p['name']} (ID: {p['id']}) at {p['updated_at']}")

except Exception as e:
    print(f"Error: {e}")
