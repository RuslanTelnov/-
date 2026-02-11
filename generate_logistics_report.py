import os
import pandas as pd
import re
from supabase import create_client
from dotenv import load_dotenv

# --- CONFIGURATION ---
LOGISTICS_TARIFF_KZT_KG = 1500
EXCHANGE_RATE_RUB_KZT = 5.2
KASPI_COMMISSION_PERCENT = 15
TAX_PERCENT = 3

# --- SETUP ---
# Load env from the project path
env_path = 'temp_tlnv_parser/moysklad-web/.env.local'
load_dotenv(env_path)

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not url or not key:
    print(f"Error: Missing Supabase credentials in {env_path}")
    exit(1)

supabase = create_client(url, key)

def get_weight_kg(specs):
    """Extract weight in kg from specs dictionary."""
    if not specs or not isinstance(specs, dict):
        return 0.1  # Default fallback weight
    
    # Common keys on WB
    keys_to_search = [
        'Вес товара с упаковкой (г)',
        'Вес товара без упаковки (г)',
        'Вес с упаковкой (кг)',
        'Вес товара (г)'
    ]
    
    for key in specs.keys():
        if 'вес' in key.lower():
            val = specs[key]
            if not val: continue
            
            # Extract number
            match = re.search(r'(\d+[.,]?\d*)', str(val))
            if match:
                num = float(match.group(1).replace(',', '.'))
                # Check unit
                if 'кг' in key.lower() or 'кг' in str(val).lower():
                    return num
                if 'г' in key.lower() or 'г' in str(val).lower() or num > 10: # Assuming if > 10 and no unit, it's grams
                    return num / 1000.0
                return num # Default to kg if unsure but small? 
    return 0.1

def calculate_ozon_delivery(price, volume_l):
    """Calculate Ozon delivery cost based on product price and volume (L)."""
    if price <= 5000:
        if volume_l <= 0.4: return 212
        if volume_l <= 1.0: return 246
        if volume_l <= 2.0: return 299
        if volume_l <= 5.0: return 418
        if volume_l <= 10.0: return 730
        return 1335
    elif price <= 15000:
        return 699
    else: # price > 15000
        if volume_l <= 1.0: return 750
        if volume_l <= 5.0: return 800
        if volume_l <= 50.0: return 1000
        if volume_l <= 150.0: return 1700
        return 3050

def calculate_logistics():
    print("Fetching data from Supabase (Parser.wb_search_results)...")
    try:
        # Fetching data from Parser schema
        res = supabase.schema('Parser').table('wb_search_results').select('id, name, price_kzt, specs, product_url').execute()
    except Exception as e:
        print(f"Error fetching data: {e}")
        return

    data = res.data
    print(f"Processing {len(data)} products...")

    report_rows = []
    
    for item in data:
        name = item.get('name', 'Unknown')
        wb_price_kzt = item.get('price_kzt', 0)
        specs = item.get('specs', {})
        url = item.get('product_url', '')

        # 1. Extraction
        weight = get_weight_kg(specs)
        # Using weight (kg) as volume (L) for Ozon formula
        volume_l = weight 
        
        # 2. Logic (Approximate, as we don't have final selling price on Kaspi/Ozon here)
        estimated_selling_price_kzt = wb_price_kzt * 1.5
        
        # Calculations using NEW Ozon Formula
        logistics_cost = calculate_ozon_delivery(estimated_selling_price_kzt, volume_l)
        
        net_buy_price = wb_price_kzt
        Total_Cost = net_buy_price + logistics_cost
        
        commission_amount = estimated_selling_price_kzt * (KASPI_COMMISSION_PERCENT / 100)
        tax_amount = estimated_selling_price_kzt * (TAX_PERCENT / 100)
        
        profit = estimated_selling_price_kzt - Total_Cost - commission_amount - tax_amount
        margin = (profit / estimated_selling_price_kzt * 100) if estimated_selling_price_kzt > 0 else 0

        report_rows.append({
            'ID WB': item.get('id'),
            'Название': name,
            'Цена на WB (₸)': round(wb_price_kzt),
            'Вес (кг/л)': round(weight, 3),
            'Логистика Ozon (₸)': round(logistics_cost),
            'Итого себестоимость (₸)': round(Total_Cost),
            'Оцен. цена продажи (₸)': round(estimated_selling_price_kzt),
            'Чистая прибыль (₸)': round(profit),
            'Маржа (%)': round(margin, 1),
            'URL': url
        })

    # Create DataFrame
    df = pd.DataFrame(report_rows)
    
    # Sort by profit
    df = df.sort_values(by='Чистая прибыль (₸)', ascending=False)

    # Export to Excel
    output_file = 'logistics_report.xlsx'
    df.to_excel(output_file, index=False)
    print(f"✅ Success! Report saved to {output_file}")
    
    # Print summary
    print(f"\nSummary:")
    print(f"Total products processed: {len(df)}")
    print(f"Profitable products: {len(df[df['Чистая прибыль (₸)'] > 0])}")

if __name__ == "__main__":
    calculate_logistics()
