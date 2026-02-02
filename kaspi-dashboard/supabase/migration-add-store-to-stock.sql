-- Миграция: Добавление поддержки складов в остатках
-- Выполните этот скрипт в SQL Editor Supabase

-- Добавляем поле store_id в таблицу stock (если его еще нет)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE stock ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_stock_store_id ON stock(store_id);
  END IF;
END $$;

-- Обновляем уникальное ограничение, чтобы разрешить несколько записей для одного товара на разных складах
DO $$
BEGIN
  -- Удаляем старое ограничение, если оно существует
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stock_product_id_key'
  ) THEN
    ALTER TABLE stock DROP CONSTRAINT stock_product_id_key;
  END IF;
  
  -- Добавляем новое составное уникальное ограничение
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stock_product_store_unique'
  ) THEN
    ALTER TABLE stock ADD CONSTRAINT stock_product_store_unique 
      UNIQUE (product_id, store_id);
  END IF;
END $$;

