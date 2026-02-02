-- Add indexes for performance optimization

-- Index for filtering sales by date (used in "Month Sales" and "Today's Sales")
CREATE INDEX IF NOT EXISTS idx_sales_moment ON sales(moment);

-- Index for filtering sales positions by date and product (used in "Month Sales Detail")
CREATE INDEX IF NOT EXISTS idx_sales_positions_moment ON sales_positions(moment);
CREATE INDEX IF NOT EXISTS idx_sales_positions_product_id ON sales_positions(product_id);

-- Index for filtering stock by store (used in "Total Products" and "Low Stock")
CREATE INDEX IF NOT EXISTS idx_stock_store_id ON stock(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_product_id ON stock(product_id);

-- Index for filtering products (used in joins and lookups)
CREATE INDEX IF NOT EXISTS idx_products_cost_price ON products(cost_price);
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(archived);
