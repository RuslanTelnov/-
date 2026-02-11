import os
from dotenv import load_dotenv
load_dotenv()
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"NEXT_PUBLIC_SUPABASE_URL: {os.getenv('NEXT_PUBLIC_SUPABASE_URL')}")
print(f"CWD: {os.getcwd()}")
