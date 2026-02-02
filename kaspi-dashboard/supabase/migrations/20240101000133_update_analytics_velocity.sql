
-- Update product_analytics view to include 7, 14, 30 day averages
DROP VIEW IF EXISTS product_analytics;
CREATE OR REPLACE VIEW product_analytics AS
WITH sales_stats AS (
    SELECT 
        product_id,
        SUM(quantity) FILTER (WHERE moment > NOW() - INTERVAL '7 days') as sales_last_7_days,
        SUM(quantity) FILTER (WHERE moment > NOW() - INTERVAL '14 days') as sales_last_14_days,
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
    COALESCE(ss.sales_last_14_days, 0) as sales_last_14_days,
    COALESCE(ss.sales_last_30_days, 0) as sales_last_30_days,
    COALESCE(ss.sales_last_60_days, 0) as sales_last_60_days,
    COALESCE(ss.sales_last_90_days, 0) as sales_last_90_days,
    
    -- Calculated Metrics (Velocities)
    CASE WHEN COALESCE(ss.sales_last_7_days, 0) > 0 THEN COALESCE(ss.sales_last_7_days, 0) / 7.0 ELSE 0 END as velocity_7_days,
    CASE WHEN COALESCE(ss.sales_last_14_days, 0) > 0 THEN COALESCE(ss.sales_last_14_days, 0) / 14.0 ELSE 0 END as velocity_14_days,
    CASE WHEN COALESCE(ss.sales_last_30_days, 0) > 0 THEN COALESCE(ss.sales_last_30_days, 0) / 30.0 ELSE 0 END as velocity_30_days,
    
    -- Legacy Metric (90 days)
    CASE 
        WHEN COALESCE(ss.sales_last_90_days, 0) > 0 THEN 
            COALESCE(ss.sales_last_90_days, 0) / 90.0 
        ELSE 0 
    END as avg_daily_sales,
    
    -- Days of Stock (Coverage) - Using 30 day velocity as default for stability, or 90 if 30 is 0?
    -- Let's stick to 90 for the view's "days_of_stock" column to be conservative, 
    -- but the API will use the specific velocities.
    CASE 
        WHEN (COALESCE(ss.sales_last_90_days, 0) / 90.0) > 0 THEN 
            COALESCE(s.total_stock, 0) / (COALESCE(ss.sales_last_90_days, 0) / 90.0)
        ELSE 999 
    END as days_of_stock,
    
    -- Margin
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
