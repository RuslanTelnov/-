import os
from pyairtable import Api
from dotenv import load_dotenv

load_dotenv()

AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY")
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID")
AIRTABLE_TABLE_NAME = os.getenv("AIRTABLE_TABLE_NAME")

class AirtableClient:
    def __init__(self):
        if not all([AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME]):
            print("⚠️ Airtable credentials not fully set in .env")
            self.table = None
            return
        
        try:
            self.api = Api(AIRTABLE_API_KEY)
            self.table = self.api.table(AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME)
            print(f"✅ Airtable client initialized for table: {AIRTABLE_TABLE_NAME}")
        except Exception as e:
            print(f"❌ Error initializing Airtable client: {e}")
            self.table = None

    def upsert_product(self, product_data):
        """
        Добавляет или обновляет запись в Airtable по Артикулу.
        Ожидает product_data с ключами: name, article, price, min_price, image_url, moysklad_id
        """
        if not self.table:
            return None

        article = product_data.get("article")
        if not article:
            print("❌ Cannot upsert to Airtable: No article provided")
            return None

        # Подготовка полей для Airtable (согласно схеме Velveto Inventory)
        fields = {
            "Name": product_data.get("name"),
            "Brand": product_data.get("brand", ""),
            "WB ID": str(article), # Используем артикул как WB ID
            "Price": float(product_data.get("price", 0)),
            "Status ": product_data.get("status", "новый"), # Обратите внимание на пробел в конце имени поля
            "Image URL": product_data.get("image_url"),
        }

        try:
            # Ищем существующую запись по WB ID
            formula = f"{{WB ID}} = '{article}'"
            existing_records = self.table.all(formula=formula)

            if existing_records:
                # Обновляем
                record_id = existing_records[0]['id']
                self.table.update(record_id, fields)
                print(f"   ⬆️ Airtable: Updated {article}")
                return record_id
            else:
                # Создаем новую
                new_record = self.table.create(fields)
                print(f"   🆕 Airtable: Created {article}")
                return new_record['id']
        except Exception as e:
            print(f"   ⚠️ Airtable Error for {article}: {e}")
            return None

if __name__ == "__main__":
    # Тестовый запуск
    client = AirtableClient()
    if client.table:
        test_data = {
            "name": "Тестовый товар",
            "article": "TEST-123",
            "price": 1000,
            "min_price": 700,
            "moysklad_id": "test-id",
            "image_url": "https://example.com/image.jpg"
        }
        client.upsert_product(test_data)
