
-- 1. Table for Procurement Orders
CREATE TABLE IF NOT EXISTS procurement_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    order_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'approved', 'ordered', 'received'
    items JSONB NOT NULL DEFAULT '[]', -- List of products and quantities
    total_cost NUMERIC DEFAULT 0,
    notes TEXT,
    created_by TEXT -- Optional: user ID or name
);

-- 2. View for Product Analytics (Aggregated Data)
-- This view joins products, stock, and sales to provide a single source of truth for the algorithm
CREATE OR REPLACE VIEW product_analytics AS
WITH sales_stats AS (
    SELECT 
        moy_sklad_id,
        SUM(quantity) FILTER (WHERE moment > NOW() - INTERVAL '7 days') as sales_last_7_days,
        SUM(quantity) FILTER (WHERE moment > NOW() - INTERVAL '30 days') as sales_last_30_days,
        MIN(moment) as first_sale_date
    FROM sales
    GROUP BY moy_sklad_id
),
stock_stats AS (
    SELECT 
        product_id,
        SUM(stock) as total_stock,
        -- We can also filter by main warehouse if needed, but total stock is safer for now
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
    p.image_url,
    
    -- Stock
    COALESCE(s.total_stock, 0) as current_stock,
    COALESCE(s.main_warehouse_stock, 0) as main_warehouse_stock,
    
    -- Sales
    COALESCE(ss.sales_last_7_days, 0) as sales_last_7_days,
    COALESCE(ss.sales_last_30_days, 0) as sales_last_30_days,
    
    -- Calculated Metrics
    CASE 
        WHEN COALESCE(ss.sales_last_30_days, 0) > 0 THEN 
            COALESCE(ss.sales_last_30_days, 0) / 30.0 
        ELSE 0 
    END as avg_daily_sales,
    
    -- Days of Stock (Coverage)
    CASE 
        WHEN (COALESCE(ss.sales_last_30_days, 0) / 30.0) > 0 THEN 
            COALESCE(s.total_stock, 0) / (COALESCE(ss.sales_last_30_days, 0) / 30.0)
        ELSE 999 -- Infinite coverage if no sales
    END as days_of_stock,
    
    -- Margin
    (p.sale_price - p.cost_price) as margin,
    CASE 
        WHEN p.sale_price > 0 THEN ((p.sale_price - p.cost_price) / p.sale_price) * 100 
        ELSE 0 
    END as margin_percent

FROM products p
LEFT JOIN stock_stats s ON s.product_id = p.id
LEFT JOIN sales_stats ss ON ss.moy_sklad_id = p.moy_sklad_id
WHERE p.archived = false;

-- 3. RLS Policies (Open for now, can be restricted later)
ALTER TABLE procurement_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON procurement_orders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON procurement_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON procurement_orders FOR UPDATE USING (true);
