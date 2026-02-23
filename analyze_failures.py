import os
from supabase import create_client
from dotenv import load_dotenv

# Load env
load_dotenv('.env')
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Missing Supabase credentials")
    exit(1)

supabase = create_client(url, key)

# Query wb_search_results for failed or unknown category
res = supabase.schema('Parser').table('wb_search_results').select("id, name, specs").execute()

failed = 0
unknown = 0
others = 0

print("🔍 Analyzing failing products...")
for row in res.data:
    specs = row.get('specs') or {}
    status = specs.get('kaspi_status')
    
    if status == 'failed':
        failed += 1
    elif status == 'unknown_category':
        unknown += 1
    else:
        others += 1

print(f"❌ Failed: {failed}")
print(f"❓ Unknown Category: {unknown}")
print(f"✅ Others: {others}")

# Show top unknown categories
if unknown > 0:
    print("\nTop Unknown Category Products:")
    found = 0
    for row in res.data:
        specs = row.get('specs') or {}
        if specs.get('kaspi_status') == 'unknown_category':
            print(f"- {row['name']} (ID: {row['id']})")
            found += 1
            if found >= 10: break
