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

res = supabase.schema('Parser').table('wb_search_results').select("specs").execute()

statuses = {}

for row in res.data:
    specs = row.get('specs') or {}
    status = specs.get('kaspi_status', 'none')
    statuses[status] = statuses.get(status, 0) + 1

print("Kaspi Status Distribution:")
for status, count in statuses.items():
    print(f"- {status}: {count}")
