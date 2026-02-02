-- Простая миграция для исправления ошибки "столбец moy_sklad_id не существует"
-- Выполните этот скрипт, если получили ошибку при создании индексов

-- Добавляем недостающие столбцы в таблицу products, если их нет
DO $$ 
BEGIN
  -- Добавляем moy_sklad_id, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'moy_sklad_id'
  ) THEN
    ALTER TABLE products ADD COLUMN moy_sklad_id TEXT;
    -- Делаем его уникальным, если таблица пустая или можем
    BEGIN
      ALTER TABLE products ADD CONSTRAINT products_moy_sklad_id_unique UNIQUE (moy_sklad_id);
    EXCEPTION WHEN others THEN
      -- Если есть дубликаты, просто добавляем без уникальности
      NULL;
    END;
  END IF;

  -- Добавляем article, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'article'
  ) THEN
    ALTER TABLE products ADD COLUMN article TEXT;
    BEGIN
      ALTER TABLE products ADD CONSTRAINT products_article_unique UNIQUE (article);
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;

  -- Делаем столбцы NOT NULL, если они еще не NOT NULL и таблица пустая
  -- (это безопасно только если таблица пустая)
  IF (SELECT COUNT(*) FROM products) = 0 THEN
    BEGIN
      ALTER TABLE products ALTER COLUMN moy_sklad_id SET NOT NULL;
    EXCEPTION WHEN others THEN
      NULL;
    END;
    
    BEGIN
      ALTER TABLE products ALTER COLUMN article SET NOT NULL;
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;
END $$;

-- Теперь создаем индексы (если их еще нет)
CREATE INDEX IF NOT EXISTS idx_products_moy_sklad_id ON products(moy_sklad_id);
CREATE INDEX IF NOT EXISTS idx_products_article ON products(article);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

