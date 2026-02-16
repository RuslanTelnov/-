import os
import sys
from dotenv import load_dotenv

# Setup path
sys.path.append(os.path.join(os.getcwd(), 'moysklad-web/automation/moysklad'))

import oprihodovanie

if __name__ == "__main__":
    article = "0329361489" # From the screenshot or a known one? 
    # The screenshot shows article 0329361489
    
    print(f"Searching for article {article}...")
    product = oprihodovanie.find_product_by_article(article)
    
    if product:
        print(f"Found product: {product['name']} (ID: {product['id']})")
        stock = oprihodovanie.get_total_stock(product['id'])
        print(f"Total Stock: {stock}")
    else:
        print("Product not found.")
