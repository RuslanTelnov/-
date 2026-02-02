
-- 1. Create sales_positions table
CREATE TABLE IF NOT EXISTS sales_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_doc_id TEXT NOT NULL, -- MoySklad ID of the sales document (demand)
    product_id UUID REFERENCES products(id), -- Link to internal product ID
    moy_sklad_product_id TEXT, -- MS ID of the product (for fallback/debugging)
    quantity NUMERIC NOT NULL DEFAULT 0,
    price NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    vat NUMERIC DEFAULT 0,
    moment TIMESTAMP WITH TIME ZONE NOT NULL, -- Denormalized from sales doc for fast querying
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_positions_product_id ON sales_positions(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_positions_moment ON sales_positions(moment);
CREATE INDEX IF NOT EXISTS idx_sales_positions_doc_id ON sales_positions(sales_doc_id);

-- 2. Update product_analytics view to use sales_positions
DROP VIEW IF EXISTS product_analytics;
CREATE OR REPLACE VIEW product_analytics AS
WITH sales_stats AS (
    SELECT 
        product_id,
        SUM(quantity) FILTER (WHERE moment > NOW() - INTERVAL '7 days') as sales_last_7_days,
        SUM(quantity) FILTER (WHERE moment > NOW() - INTERVAL '30 days') as sales_last_30_days,
        SUM(quantity) FILTER (WHERE moment > NOW() - INTERVAL '60 days') as sales_last_60_days,
        SUM(quantity) FILTER (WHERE moment > NOW() - INTERVAL '90 days') as sales_last_90_days,
        MIN(moment) as first_sale_date
    FROM sales_positions
    GROUP BY product_id
),
stock_stats AS (
    SELECT 
        product_id,
        SUM(stock) as total_stock,
        SUM(CASE WHEN store_id = 'd9b1edb8-4508-43e4-909b-2599a6502241' THEN stock ELSE 0 END) as main_warehouse_stock
    FROM stock
    GROUP BY product_id
)
SELECT 
    p.id as product_id,
    p.name,
    p.article,
    p.cost_price,
    p.sale_price,
    p.kaspi_price,
    p.image_url,
    
    -- Stock
    COALESCE(s.total_stock, 0) as current_stock,
    COALESCE(s.main_warehouse_stock, 0) as main_warehouse_stock,
    
    -- Sales
    COALESCE(ss.sales_last_7_days, 0) as sales_last_7_days,
    COALESCE(ss.sales_last_30_days, 0) as sales_last_30_days,
    COALESCE(ss.sales_last_60_days, 0) as sales_last_60_days,
    COALESCE(ss.sales_last_90_days, 0) as sales_last_90_days,
    
    -- Calculated Metrics
    CASE 
        WHEN COALESCE(ss.sales_last_90_days, 0) > 0 THEN 
            COALESCE(ss.sales_last_90_days, 0) / 90.0 
        ELSE 0 
    END as avg_daily_sales,
    
    -- Days of Stock (Coverage)
    CASE 
        WHEN (COALESCE(ss.sales_last_90_days, 0) / 90.0) > 0 THEN 
            COALESCE(s.total_stock, 0) / (COALESCE(ss.sales_last_90_days, 0) / 90.0)
        ELSE 999 -- Infinite coverage if no sales
    END as days_of_stock,
    
    -- Margin (Prioritize Kaspi Price)
    (COALESCE(NULLIF(p.kaspi_price, 0), p.sale_price) - p.cost_price) as margin,
    CASE 
        WHEN COALESCE(NULLIF(p.kaspi_price, 0), p.sale_price) > 0 THEN 
            ((COALESCE(NULLIF(p.kaspi_price, 0), p.sale_price) - p.cost_price) / COALESCE(NULLIF(p.kaspi_price, 0), p.sale_price)) * 100 
        ELSE 0 
    END as margin_percent

FROM products p
LEFT JOIN stock_stats s ON s.product_id = p.id
LEFT JOIN sales_stats ss ON ss.product_id = p.id
WHERE p.archived = false;

-- 3. RLS for sales_positions
-- 3. RLS for sales_positions
ALTER TABLE sales_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON sales_positions;
CREATE POLICY "Enable read access for all users" ON sales_positions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON sales_positions;
CREATE POLICY "Enable insert access for all users" ON sales_positions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON sales_positions;
CREATE POLICY "Enable update access for all users" ON sales_positions FOR UPDATE USING (true);
