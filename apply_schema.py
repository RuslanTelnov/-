import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Default local Supabase DB credentials
DB_HOST = "127.0.0.1"
DB_PORT = "54322"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "postgres"

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Drop table to force recreation with new schema
    print("🗑️  Dropping table products...")
    cursor.execute("DROP TABLE IF EXISTS products;")
    
    # Read create_table.sql
    with open("create_table.sql", "r") as f:
        sql = f.read()
        
    print("🆕 Creating table products...")
    cursor.execute(sql)
    
    print("✅ Schema applied successfully")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error applying schema: {e}")
