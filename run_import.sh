#!/bin/bash
# Скрипт запуска импорта

# Переходим в директорию скрипта
cd "$(dirname "$0")"

# Проверка наличия venv
if [ ! -d ".venv" ]; then
    echo "🔧 Создание виртуального окружения..."
    python3.11 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi

# Запуск
echo "🚀 Запуск Python скрипта..."
.venv/bin/python import_products.py
