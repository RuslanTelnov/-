-- Dashboard Stats View
-- Aggregates high-level metrics to avoid fetching all rows

-- Ensure columns exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS moment TIMESTAMP WITH TIME ZONE;

CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM products WHERE archived = false) as total_products,
  (SELECT COALESCE(SUM(stock), 0) FROM stock) as total_stock_items,
  (SELECT COUNT(*) FROM stock WHERE stock < 10) as low_stock_items,
  (SELECT COALESCE(SUM(sum), 0) FROM money_by_account) as total_balance,
  (SELECT COUNT(*) FROM product_metrics WHERE priority_score > 0) as high_priority_items;

-- Comment
COMMENT ON VIEW dashboard_stats IS 'Aggregated statistics for the main dashboard';
