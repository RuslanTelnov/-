import requests
import json
import os
from dotenv import load_dotenv

if os.path.exists(".env.ozon"):
    load_dotenv(".env.ozon")
else:
    load_dotenv(os.path.join(os.getcwd(), "ozon-automation", ".env.ozon"))

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

headers = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

def search_category(query):
    url = "https://api-seller.ozon.ru/v1/description-category/tree"
    print("Fetching category tree...")
    try:
        resp = requests.post(url, headers=headers, json={})
        if resp.status_code != 200:
            print(f"Error: {resp.status_code} - {resp.text}")
            return

        data = resp.json()
        tree = data.get('result', [])
        if tree:
            print(f"First item keys: {tree[0].keys()}")
        
        print(f"Searching for '{query}'...")
        
        found = []
        
        def traverse(nodes, path=""):
            for node in nodes:
                name = node.get('category_name', 'Unknown')
                current_path = f"{path} -> {name}" if path else name
                
                if query.lower() in name.lower():
                    found.append({
                        "id": node.get('description_category_id'),
                        "name": name,
                        "path": current_path,
                        "children": [c.get('category_name') for c in node.get('children', [])]
                    })
                
                if 'children' in node:
                    traverse(node['children'], current_path)
                    
        traverse(tree)
        
        for item in found:
            print(f"Found: {item['name']} (ID: {item['id']})")
            print(f"Path: {item['path']}")
            print("-" * 20)
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    import sys
    query = sys.argv[1] if len(sys.argv) > 1 else "ролик"
    search_category(query)
