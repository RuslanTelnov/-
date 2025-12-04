import os
import requests
import base64
from dotenv import load_dotenv
import json

# Загрузка переменных окружения
load_dotenv()

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

if not LOGIN or not PASSWORD:
    print("❌ Ошибка: Не найдены логин или пароль в .env файле")
    exit(1)

# Формирование заголовка авторизации
auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
headers = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def get_metadata(entity):
    """Получение метаданных сущности"""
    url = f"{BASE_URL}/entity/{entity}/metadata"
    print(f"🔍 Запрос метаданных для {entity}...")
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Ошибка при запросе к API: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Статус: {e.response.status_code}")
            print(f"   Ответ: {e.response.text}")
        return None

def get_all_countries():
    """Получение списка стран"""
    url = f"{BASE_URL}/entity/country"
    print(f"🔍 Запрос списка стран...")
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data.get('rows', [])
    except requests.exceptions.RequestException as e:
        print(f"❌ Ошибка при запросе стран: {e}")
        return []

def main():
    print("="*50)
    print("🛠️  ПРОВЕРКА МЕТАДАННЫХ МОЙСКЛАД")
    print("="*50)
    
    # 1. Проверка доп. полей товара
    product_meta = get_metadata("product")
    
    if product_meta:
        attributes = product_meta.get('attributes', [])
        print(f"DEBUG: type(attributes) = {type(attributes)}")
        print(f"DEBUG: attributes content = {attributes}")
        
        # Если это словарь и есть 'rows', берем их
        if isinstance(attributes, dict):
            if 'rows' in attributes:
                attributes = attributes['rows']
            elif 'meta' in attributes:
                # Нужно сделать отдельный запрос
                attr_url = attributes['meta']['href']
                print(f"🔍 Дополнительный запрос атрибутов: {attr_url}")
                try:
                    resp = requests.get(attr_url, headers=headers)
                    resp.raise_for_status()
                    attributes = resp.json().get('rows', [])
                except Exception as e:
                    print(f"❌ Ошибка получения атрибутов: {e}")
                    attributes = []

        
        if len(attributes) > 0:
            print("-" * 30)
            print(f"{'ID':<40} | {'Имя':<20} | {'Тип'}")
            print("-" * 30)
            for attr in attributes:
                print(f"DEBUG: {attr}")
                print(f"{attr.get('id', '?'):<40} | {attr.get('name', '?'):<20} | {attr.get('type', '?')}")
        else:
            print("   Нет дополнительных полей.")
    
    # 2. Проверка стран
    countries = get_all_countries()
    print(f"\n🌍 Найдено стран: {len(countries)}")
    
    if len(countries) > 0:
        print("-" * 30)
        print(f"{'ID':<40} | {'Имя':<20} | {'Код'}")
        print("-" * 30)
        # Выведем первые 10 стран для примера
        for country in countries[:10]:
            print(f"{country['id']:<40} | {country['name']:<20} | {country.get('code', '-')}")
        if len(countries) > 10:
            print(f"... и еще {len(countries) - 10}")

if __name__ == "__main__":
    main()
