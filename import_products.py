import os
import json
import time
import base64
import requests
import pandas as pd
from dotenv import load_dotenv

# Загрузка настроек
load_dotenv()
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

# ID Доп. полей (найдены через check_metadata.py)
ATTR_PREORDER_ID = "677beb5d-7769-11f0-0a80-00cb000c69da" # Тип: long (Целое число)

# Заголовки
auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def get_all_countries():
    """Загрузка всех стран для маппинга"""
    print("🌍 Загрузка справочника стран...")
    url = f"{BASE_URL}/entity/country"
    countries = {}
    try:
        resp = requests.get(url, headers=HEADERS)
        resp.raise_for_status()
        data = resp.json()
        for row in data.get('rows', []):
            countries[row['name'].lower()] = row['meta']
            # Также добавим поиск по коду, если нужно
            if 'code' in row:
                countries[str(row['code'])] = row['meta']
    except Exception as e:
        print(f"❌ Ошибка загрузки стран: {e}")
    return countries

def find_counterparty(name):
    """Поиск контрагента (поставщика) по имени"""
    if not name or pd.isna(name):
        return None
        
    url = f"{BASE_URL}/entity/counterparty?filter=name={name}"
    try:
        resp = requests.get(url, headers=HEADERS)
        resp.raise_for_status()
        data = resp.json()
        if data.get('rows'):
            return data['rows'][0]['meta']
    except Exception as e:
        print(f"⚠️  Ошибка поиска поставщика '{name}': {e}")
    return None

def find_product_by_article(article):
    """Проверка существования товара по артикулу"""
    url = f"{BASE_URL}/entity/product?filter=article={article}"
    try:
        resp = requests.get(url, headers=HEADERS)
        resp.raise_for_status()
        data = resp.json()
        if data.get('rows'):
            return data['rows'][0]
    except Exception as e:
        print(f"⚠️  Ошибка проверки товара '{article}': {e}")
    return None

def create_product(row, countries_map):
    """Создание товара из строки Excel"""
    name = row.get('Название')
    article = str(row.get('Артикул', '')).strip()
    
    if not name or not article:
        print("❌ Пропуск: Нет названия или артикула")
        return False

    # 1. Проверка дубликата
    if find_product_by_article(article):
        print(f"⏭️  Товар существует: {article}")
        return False

    # 2. Поиск связей
    country_meta = None
    country_name = str(row.get('Страна', '')).strip().lower()
    if country_name in countries_map:
        country_meta = countries_map[country_name]
    elif country_name:
        print(f"⚠️  Страна не найдена: {row.get('Страна')}")

    supplier_meta = find_counterparty(row.get('Поставщик'))
    if row.get('Поставщик') and not supplier_meta:
        print(f"⚠️  Поставщик не найден: {row.get('Поставщик')}")

    # 3. Цены
    min_price = float(row.get('Минимальная цена', 0)) * 100 # Копейки
    sale_price = float(row.get('Розничная цена', 0)) * 100 # Копейки

    # 4. Атрибуты (Предзаказ)
    attributes = []
    preorder_val = row.get('Строка предзаказ')
    if pd.notna(preorder_val):
        try:
            # API требует long, пробуем преобразовать
            val_long = int(float(preorder_val))
            attributes.append({
                "meta": {
                    "href": f"{BASE_URL}/entity/product/metadata/attributes/{ATTR_PREORDER_ID}",
                    "type": "attributemetadata",
                    "mediaType": "application/json"
                },
                "value": val_long
            })
        except ValueError:
            print(f"⚠️  Ошибка поля 'Предзаказ': значение '{preorder_val}' не является числом (требуется целое число)")

    # 5. Сборка JSON
    product_data = {
        "name": name,
        "article": article,
        "minPrice": {"value": min_price, "currency": {"meta": {"href": f"{BASE_URL}/entity/currency/rub", "type": "currency", "mediaType": "application/json"}}}, # Валюта по умолчанию рубли, нужно проверять
        "salePrices": [
            {
                "value": sale_price,
                "priceType": {"name": "Цена продажи"} # Обычно это дефолтный тип
            }
        ]
    }

    if country_meta:
        product_data["country"] = {"meta": country_meta}
    
    if supplier_meta:
        product_data["supplier"] = {"meta": supplier_meta}
        
    if attributes:
        product_data["attributes"] = attributes

    # 6. Отправка
    try:
        resp = requests.post(f"{BASE_URL}/entity/product", json=product_data, headers=HEADERS)
        resp.raise_for_status()
        print(f"✅ Создан товар: {name} ({article})")
        return True
    except Exception as e:
        print(f"❌ Ошибка создания товара {article}: {e}")
        if hasattr(e, 'response') and e.response is not None:
             print(f"   Ответ сервера: {e.response.text}")
        return False

def main():
    print("🚀 Запуск импорта товаров...")
    
    # 1. Загрузка справочников
    countries_map = get_all_countries()
    
    # 2. Чтение файла
    input_dir = "input"
    files = [f for f in os.listdir(input_dir) if f.endswith('.xlsx') or f.endswith('.xls')]
    
    if not files:
        print(f"❌ В папке {input_dir} нет Excel файлов!")
        return

    file_path = os.path.join(input_dir, files[0])
    print(f"📂 Чтение файла: {file_path}")
    
    try:
        df = pd.read_excel(file_path)
    except Exception as e:
        print(f"❌ Ошибка чтения Excel: {e}")
        return

    # Нормализация имен колонок (убираем лишние пробелы)
    df.columns = df.columns.str.strip()
    
    print(f"📊 Найдено строк: {len(df)}")
    
    success_count = 0
    for index, row in df.iterrows():
        if create_product(row, countries_map):
            success_count += 1
        # Пауза чтобы не спамить API (лимиты)
        time.sleep(0.3)
        
    print("="*30)
    print(f"🏁 Готово! Создано товаров: {success_count}")

if __name__ == "__main__":
    main()
