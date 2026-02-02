-- Создание таблиц для хранения данных из Мой склад

-- Таблица товаров (артикул - уникальный ключ)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  article TEXT UNIQUE NOT NULL, -- Ключевая строка - уникальный артикул
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица остатков
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stock DECIMAL(10, 2) DEFAULT 0,
  reserve DECIMAL(10, 2) DEFAULT 0,
  in_transit DECIMAL(10, 2) DEFAULT 0,
  quantity DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Таблица продаж
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

-- Таблица закупок
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

-- Таблица контрагентов
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

-- Таблица складов
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица заказов покупателей
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
  positions JSONB, -- Детали заказа с артикулами
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица входящих платежей
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

-- Таблица исходящих платежей
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

-- Таблица приходных ордеров
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

-- Таблица расходных ордеров
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

-- Таблица списаний
CREATE TABLE IF NOT EXISTS losses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum DECIMAL(10, 2) DEFAULT 0,
  quantity DECIMAL(10, 2) DEFAULT 0,
  positions JSONB, -- Детали списания с артикулами
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица оборотов (отчет)
CREATE TABLE IF NOT EXISTS turnover (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article TEXT NOT NULL, -- Артикул товара
  product_name TEXT,
  quantity DECIMAL(10, 2) DEFAULT 0,
  sum DECIMAL(10, 2) DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  data JSONB, -- Полные данные отчета
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article, period_start, period_end)
);

-- Таблица прибыли по товарам (отчет)
CREATE TABLE IF NOT EXISTS profit_by_product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article TEXT NOT NULL, -- Артикул товара
  product_name TEXT,
  revenue DECIMAL(10, 2) DEFAULT 0, -- Выручка
  cost DECIMAL(10, 2) DEFAULT 0, -- Себестоимость
  profit DECIMAL(10, 2) DEFAULT 0, -- Прибыль
  margin DECIMAL(5, 2) DEFAULT 0, -- Маржа в %
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  data JSONB, -- Полные данные отчета
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article, period_start, period_end)
);

-- Таблица денег по счетам (отчет)
CREATE TABLE IF NOT EXISTS money_by_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  account_type TEXT,
  balance DECIMAL(10, 2) DEFAULT 0,
  income DECIMAL(10, 2) DEFAULT 0,
  outcome DECIMAL(10, 2) DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  data JSONB, -- Полные данные отчета
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_name, period_start, period_end)
);

-- Таблица ключевых показателей (расчетные метрики)
CREATE TABLE IF NOT EXISTS product_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article TEXT UNIQUE NOT NULL, -- Артикул товара (уникальный ключ)
  product_name TEXT,
  
  -- Оборачиваемость
  turnover_ratio DECIMAL(10, 4) DEFAULT 0, -- Коэффициент оборачиваемости
  turnover_days DECIMAL(10, 2) DEFAULT 0, -- Дни оборачиваемости
  
  -- Маржа
  margin_percent DECIMAL(5, 2) DEFAULT 0, -- Маржа в процентах
  margin_amount DECIMAL(10, 2) DEFAULT 0, -- Маржа в деньгах
  
  -- Ликвидность
  liquidity_score DECIMAL(5, 2) DEFAULT 0, -- Оценка ликвидности (0-100)
  sales_velocity DECIMAL(10, 2) DEFAULT 0, -- Скорость продаж (ед/день)
  
  -- Выручка
  total_revenue DECIMAL(10, 2) DEFAULT 0, -- Общая выручка
  avg_revenue_per_day DECIMAL(10, 2) DEFAULT 0, -- Средняя выручка в день
  
  -- Остатки
  current_stock DECIMAL(10, 2) DEFAULT 0, -- Текущий остаток
  avg_stock DECIMAL(10, 2) DEFAULT 0, -- Средний остаток за период
  
  -- Рекомендации
  recommendation TEXT, -- Рекомендация по товару
  priority_score DECIMAL(5, 2) DEFAULT 0, -- Приоритет для оптимизации (0-100)
  
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица для торговых данных (для будущего расширения)
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

-- Индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_products_moy_sklad_id ON products(moy_sklad_id);
CREATE INDEX IF NOT EXISTS idx_products_article ON products(article); -- Индекс по артикулу
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_stock_product_id ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_moy_sklad_id ON sales(moy_sklad_id);
CREATE INDEX IF NOT EXISTS idx_sales_moment ON sales(moment);
CREATE INDEX IF NOT EXISTS idx_purchases_moy_sklad_id ON purchases(moy_sklad_id);
CREATE INDEX IF NOT EXISTS idx_purchases_moment ON purchases(moment);
CREATE INDEX IF NOT EXISTS idx_counterparties_moy_sklad_id ON counterparties(moy_sklad_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_moment ON customer_orders(moment);
CREATE INDEX IF NOT EXISTS idx_payments_in_moment ON payments_in(moment);
CREATE INDEX IF NOT EXISTS idx_payments_out_moment ON payments_out(moment);
CREATE INDEX IF NOT EXISTS idx_turnover_article ON turnover(article);
CREATE INDEX IF NOT EXISTS idx_profit_by_product_article ON profit_by_product(article);
CREATE INDEX IF NOT EXISTS idx_product_metrics_article ON product_metrics(article);
CREATE INDEX IF NOT EXISTS idx_product_metrics_priority ON product_metrics(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_trade_data_category ON trade_data(category);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_counterparties_updated_at BEFORE UPDATE ON counterparties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_data_updated_at BEFORE UPDATE ON trade_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_orders_updated_at BEFORE UPDATE ON customer_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_in_updated_at BEFORE UPDATE ON payments_in
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_out_updated_at BEFORE UPDATE ON payments_out
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_in_updated_at BEFORE UPDATE ON cash_in
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_out_updated_at BEFORE UPDATE ON cash_out
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_losses_updated_at BEFORE UPDATE ON losses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turnover_updated_at BEFORE UPDATE ON turnover
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profit_by_product_updated_at BEFORE UPDATE ON profit_by_product
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_money_by_account_updated_at BEFORE UPDATE ON money_by_account
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_metrics_updated_at BEFORE UPDATE ON product_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

