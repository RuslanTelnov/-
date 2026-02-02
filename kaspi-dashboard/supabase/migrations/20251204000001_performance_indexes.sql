-- Performance Indexes

-- Ensure columns exist
ALTER TABLE stock ADD COLUMN IF NOT EXISTS store_id UUID;
ALTER TABLE profit_by_product ADD COLUMN IF NOT EXISTS moment TIMESTAMP WITH TIME ZONE;
ALTER TABLE profit_by_product ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Stock table
CREATE INDEX IF NOT EXISTS idx_stock_product_id ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_store_id ON stock(store_id);

-- Sales table
CREATE INDEX IF NOT EXISTS idx_sales_moment ON sales(moment);

-- Profit by Product table
CREATE INDEX IF NOT EXISTS idx_profit_by_product_moment ON profit_by_product(moment);
CREATE INDEX IF NOT EXISTS idx_profit_by_product_product_id ON profit_by_product(product_id);

-- Products table
CREATE INDEX IF NOT EXISTS idx_products_article ON products(article);
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(archived);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

-- Money by Account
CREATE INDEX IF NOT EXISTS idx_money_by_account_period ON money_by_account(period_end);
