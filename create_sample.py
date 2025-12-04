import pandas as pd
import os

data = {
    "Название": ["Тестовый Товар 1", "Тестовый Товар 2"],
    "Артикул": ["TEST-001", "TEST-002"],
    "Минимальная цена": [1000, 2000],
    "Розничная цена": [1500, 3000],
    "Страна": ["Китай", "Россия"]
}

df = pd.DataFrame(data)

output_dir = "input"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

output_file = os.path.join(output_dir, "sample_order.xlsx")
df.to_excel(output_file, index=False)

print(f"✅ Создан файл: {output_file}")
