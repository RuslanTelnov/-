-- ============================================
-- РАБОЧАЯ СХЕМА БАЗЫ ДАННЫХ С УМНОЙ МИГРАЦИЕЙ
-- Этот скрипт безопасно работает с существующими таблицами
-- ============================================

-- ШАГ 1: Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ШАГ 2: Умная миграция таблицы products
DO $$ 
DECLARE
  has_id BOOLEAN;
  has_pk BOOLEAN;
  pk_column TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    -- Проверяем наличие столбца id
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'id'
    ) INTO has_id;
    
    -- Проверяем наличие первичного ключа
    SELECT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'products' AND constraint_type = 'PRIMARY KEY'
    ) INTO has_pk;
    
    -- Если нет id, добавляем его
    IF NOT has_id THEN
      ALTER TABLE products ADD COLUMN id UUID DEFAULT gen_random_uuid();
      -- Делаем его первичным ключом только если первичного ключа нет
      IF NOT has_pk THEN
        ALTER TABLE products ADD PRIMARY KEY (id);
      END IF;
    END IF;
    
    -- Добавляем moy_sklad_id, если его нет
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'moy_sklad_id'
    ) THEN
      ALTER TABLE products ADD COLUMN moy_sklad_id TEXT;
    END IF;
    
    -- Добавляем article, если его нет
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'article'
    ) THEN
      ALTER TABLE products ADD COLUMN article TEXT;
    END IF;
    
    -- Добавляем остальные столбцы, если их нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name') THEN
      ALTER TABLE products ADD COLUMN name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'code') THEN
      ALTER TABLE products ADD COLUMN code TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description') THEN
      ALTER TABLE products ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price') THEN
      ALTER TABLE products ADD COLUMN price DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sale_price') THEN
      ALTER TABLE products ADD COLUMN sale_price DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'quantity') THEN
      ALTER TABLE products ADD COLUMN quantity INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'created_at') THEN
      ALTER TABLE products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updated_at') THEN
      ALTER TABLE products ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Добавляем ограничения уникальности только если их нет
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_moy_sklad_id_key'
      ) THEN
        ALTER TABLE products ADD CONSTRAINT products_moy_sklad_id_key UNIQUE (moy_sklad_id);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_article_key'
      ) THEN
        ALTER TABLE products ADD CONSTRAINT products_article_key UNIQUE (article);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- ШАГ 3: Создаем таблицу products (если ее нет)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  article TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ШАГ 4: Умная миграция таблицы stock
DO $$ 
DECLARE
  has_id BOOLEAN;
  has_pk BOOLEAN;
  has_product_id BOOLEAN;
  products_has_id BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock') THEN
    -- Проверяем наличие столбца id
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock' AND column_name = 'id'
    ) INTO has_id;
    
    -- Проверяем наличие первичного ключа
    SELECT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'stock' AND constraint_type = 'PRIMARY KEY'
    ) INTO has_pk;
    
    -- Проверяем наличие product_id
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock' AND column_name = 'product_id'
    ) INTO has_product_id;
    
    -- Проверяем наличие id в products
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'id'
    ) INTO products_has_id;
    
    -- Добавляем id, если его нет
    IF NOT has_id THEN
      ALTER TABLE stock ADD COLUMN id UUID DEFAULT gen_random_uuid();
      IF NOT has_pk THEN
        ALTER TABLE stock ADD PRIMARY KEY (id);
      END IF;
    END IF;
    
    -- Добавляем product_id, если его нет
    IF NOT has_product_id THEN
      ALTER TABLE stock ADD COLUMN product_id UUID;
    END IF;
    
    -- Добавляем остальные столбцы
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock' AND column_name = 'stock') THEN
      ALTER TABLE stock ADD COLUMN stock DECIMAL(10, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock' AND column_name = 'reserve') THEN
      ALTER TABLE stock ADD COLUMN reserve DECIMAL(10, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock' AND column_name = 'in_transit') THEN
      ALTER TABLE stock ADD COLUMN in_transit DECIMAL(10, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock' AND column_name = 'quantity') THEN
      ALTER TABLE stock ADD COLUMN quantity DECIMAL(10, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock' AND column_name = 'created_at') THEN
      ALTER TABLE stock ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock' AND column_name = 'updated_at') THEN
      ALTER TABLE stock ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Добавляем внешний ключ только если все условия выполнены
    IF has_product_id AND products_has_id THEN
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'stock_product_id_fkey'
        ) THEN
          ALTER TABLE stock ADD CONSTRAINT stock_product_id_fkey 
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
    
    -- Добавляем уникальное ограничение на product_id
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'stock_product_id_key'
      ) THEN
        ALTER TABLE stock ADD CONSTRAINT stock_product_id_key UNIQUE (product_id);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- ШАГ 5: Создаем таблицу stock (если ее нет)
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock DECIMAL(10, 2) DEFAULT 0,
  reserve DECIMAL(10, 2) DEFAULT 0,
  in_transit DECIMAL(10, 2) DEFAULT 0,
  quantity DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- ШАГ 6: Создаем остальные таблицы
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  quantity DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  quantity DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  inn TEXT,
  kpp TEXT,
  legal_address TEXT,
  actual_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  quantity DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  state_name TEXT,
  positions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments_in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments_out (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_out (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  agent_name TEXT,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS losses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  quantity DECIMAL(10, 2) DEFAULT 0,
  positions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS turnover (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article TEXT NOT NULL,
  product_name TEXT,
  quantity DECIMAL(10, 2) DEFAULT 0,
  sum DECIMAL(10, 2) DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS profit_by_product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article TEXT NOT NULL,
  product_name TEXT,
  revenue DECIMAL(10, 2) DEFAULT 0,
  cost DECIMAL(10, 2) DEFAULT 0,
  profit DECIMAL(10, 2) DEFAULT 0,
  margin DECIMAL(5, 2) DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS money_by_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  account_type TEXT,
  balance DECIMAL(10, 2) DEFAULT 0,
  income DECIMAL(10, 2) DEFAULT 0,
  outcome DECIMAL(10, 2) DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_name, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS product_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article TEXT UNIQUE NOT NULL,
  product_name TEXT,
  turnover_ratio DECIMAL(10, 4) DEFAULT 0,
  turnover_days DECIMAL(10, 2) DEFAULT 0,
  margin_percent DECIMAL(5, 2) DEFAULT 0,
  margin_amount DECIMAL(10, 2) DEFAULT 0,
  liquidity_score DECIMAL(5, 2) DEFAULT 0,
  sales_velocity DECIMAL(10, 2) DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  avg_revenue_per_day DECIMAL(10, 2) DEFAULT 0,
  current_stock DECIMAL(10, 2) DEFAULT 0,
  avg_stock DECIMAL(10, 2) DEFAULT 0,
  recommendation TEXT,
  priority_score DECIMAL(5, 2) DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ШАГ 7: Создаем индексы (только если таблицы и столбцы существуют)
DO $$ 
BEGIN
  -- Индексы для products
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'moy_sklad_id') THEN
      CREATE INDEX IF NOT EXISTS idx_products_moy_sklad_id ON products(moy_sklad_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'article') THEN
      CREATE INDEX IF NOT EXISTS idx_products_article ON products(article);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name') THEN
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    END IF;
  END IF;
  
  -- Индексы для stock
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock' AND column_name = 'product_id') THEN
      CREATE INDEX IF NOT EXISTS idx_stock_product_id ON stock(product_id);
    END IF;
  END IF;
  
  -- Индексы для sales
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
    CREATE INDEX IF NOT EXISTS idx_sales_moy_sklad_id ON sales(moy_sklad_id);
    CREATE INDEX IF NOT EXISTS idx_sales_moment ON sales(moment);
  END IF;
  
  -- Индексы для purchases
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases') THEN
    CREATE INDEX IF NOT EXISTS idx_purchases_moy_sklad_id ON purchases(moy_sklad_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_moment ON purchases(moment);
  END IF;
  
  -- Индексы для counterparties
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'counterparties') THEN
    CREATE INDEX IF NOT EXISTS idx_counterparties_moy_sklad_id ON counterparties(moy_sklad_id);
  END IF;
  
  -- Индексы для customer_orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_orders') THEN
    CREATE INDEX IF NOT EXISTS idx_customer_orders_moment ON customer_orders(moment);
  END IF;
  
  -- Индексы для payments_in
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments_in') THEN
    CREATE INDEX IF NOT EXISTS idx_payments_in_moment ON payments_in(moment);
  END IF;
  
  -- Индексы для payments_out
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments_out') THEN
    CREATE INDEX IF NOT EXISTS idx_payments_out_moment ON payments_out(moment);
  END IF;
  
  -- Индексы для turnover
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'turnover') THEN
    CREATE INDEX IF NOT EXISTS idx_turnover_article ON turnover(article);
  END IF;
  
  -- Индексы для profit_by_product
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profit_by_product') THEN
    CREATE INDEX IF NOT EXISTS idx_profit_by_product_article ON profit_by_product(article);
  END IF;
  
  -- Индексы для product_metrics
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_metrics') THEN
    CREATE INDEX IF NOT EXISTS idx_product_metrics_article ON product_metrics(article);
    CREATE INDEX IF NOT EXISTS idx_product_metrics_priority ON product_metrics(priority_score DESC);
  END IF;
  
  -- Индексы для trade_data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_data') THEN
    CREATE INDEX IF NOT EXISTS idx_trade_data_category ON trade_data(category);
  END IF;
END $$;

-- ШАГ 8: Создаем триггеры (с проверкой существования)
DO $$ 
BEGIN
  -- Триггер для products
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
      CREATE TRIGGER update_products_updated_at 
        BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для stock
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stock_updated_at') THEN
      CREATE TRIGGER update_stock_updated_at 
        BEFORE UPDATE ON stock
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для sales
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sales_updated_at') THEN
      CREATE TRIGGER update_sales_updated_at 
        BEFORE UPDATE ON sales
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для purchases
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchases_updated_at') THEN
      CREATE TRIGGER update_purchases_updated_at 
        BEFORE UPDATE ON purchases
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для counterparties
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'counterparties') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_counterparties_updated_at') THEN
      CREATE TRIGGER update_counterparties_updated_at 
        BEFORE UPDATE ON counterparties
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для stores
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stores_updated_at') THEN
      CREATE TRIGGER update_stores_updated_at 
        BEFORE UPDATE ON stores
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для customer_orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_orders') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_customer_orders_updated_at') THEN
      CREATE TRIGGER update_customer_orders_updated_at 
        BEFORE UPDATE ON customer_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для payments_in
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments_in') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_in_updated_at') THEN
      CREATE TRIGGER update_payments_in_updated_at 
        BEFORE UPDATE ON payments_in
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для payments_out
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments_out') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_out_updated_at') THEN
      CREATE TRIGGER update_payments_out_updated_at 
        BEFORE UPDATE ON payments_out
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для cash_in
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_in') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cash_in_updated_at') THEN
      CREATE TRIGGER update_cash_in_updated_at 
        BEFORE UPDATE ON cash_in
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для cash_out
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_out') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cash_out_updated_at') THEN
      CREATE TRIGGER update_cash_out_updated_at 
        BEFORE UPDATE ON cash_out
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для losses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'losses') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_losses_updated_at') THEN
      CREATE TRIGGER update_losses_updated_at 
        BEFORE UPDATE ON losses
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для turnover
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'turnover') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_turnover_updated_at') THEN
      CREATE TRIGGER update_turnover_updated_at 
        BEFORE UPDATE ON turnover
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для profit_by_product
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profit_by_product') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profit_by_product_updated_at') THEN
      CREATE TRIGGER update_profit_by_product_updated_at 
        BEFORE UPDATE ON profit_by_product
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для money_by_account
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'money_by_account') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_money_by_account_updated_at') THEN
      CREATE TRIGGER update_money_by_account_updated_at 
        BEFORE UPDATE ON money_by_account
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для product_metrics
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_metrics') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_metrics_updated_at') THEN
      CREATE TRIGGER update_product_metrics_updated_at 
        BEFORE UPDATE ON product_metrics
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  -- Триггер для trade_data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_data') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_trade_data_updated_at') THEN
      CREATE TRIGGER update_trade_data_updated_at 
        BEFORE UPDATE ON trade_data
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END $$;

-- ============================================
-- ГОТОВО! Все таблицы созданы/обновлены
-- ============================================

