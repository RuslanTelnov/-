 WITH sales_stats AS (
         SELECT sales_positions.product_id,
            sum(sales_positions.quantity) FILTER (WHERE sales_positions.moment > (now() - '7 days'::interval)) AS sales_last_7_days,
            sum(sales_positions.quantity) FILTER (WHERE sales_positions.moment > (now() - '30 days'::interval)) AS sales_last_30_days,
            sum(sales_positions.quantity) FILTER (WHERE sales_positions.moment > (now() - '60 days'::interval)) AS sales_last_60_days,
            sum(sales_positions.quantity) FILTER (WHERE sales_positions.moment > (now() - '90 days'::interval)) AS sales_last_90_days,
            min(sales_positions.moment) AS first_sale_date
           FROM sales_positions
          GROUP BY sales_positions.product_id
        ), stock_stats AS (
         SELECT stock.product_id,
            sum(stock.stock) AS total_stock,
            sum(
                CASE
                    WHEN stock.store_id = 'd9b1edb8-4508-43e4-909b-2599a6502241'::uuid THEN stock.stock
                    ELSE 0::numeric
                END) AS main_warehouse_stock
           FROM stock
          GROUP BY stock.product_id
        )
 SELECT p.id AS product_id,
    p.name,
    p.article,
    p.cost_price,
    p.sale_price,
    p.kaspi_price,
    p.image_url,
    COALESCE(s.total_stock, 0::numeric) AS current_stock,
    COALESCE(s.main_warehouse_stock, 0::numeric) AS main_warehouse_stock,
    COALESCE(ss.sales_last_7_days, 0::numeric) AS sales_last_7_days,
    COALESCE(ss.sales_last_30_days, 0::numeric) AS sales_last_30_days,
    COALESCE(ss.sales_last_60_days, 0::numeric) AS sales_last_60_days,
    COALESCE(ss.sales_last_90_days, 0::numeric) AS sales_last_90_days,
        CASE
            WHEN COALESCE(ss.sales_last_90_days, 0::numeric) > 0::numeric THEN COALESCE(ss.sales_last_90_days, 0::numeric) / 90.0
            ELSE 0::numeric
        END AS avg_daily_sales,
        CASE
            WHEN (COALESCE(ss.sales_last_90_days, 0::numeric) / 90.0) > 0::numeric THEN COALESCE(s.total_stock, 0::numeric) / (COALESCE(ss.sales_last_90_days, 0::numeric) / 90.0)
            ELSE 999::numeric
        END AS days_of_stock,
    COALESCE(NULLIF(p.kaspi_price, 0::numeric), p.sale_price) - p.cost_price AS margin,
        CASE
            WHEN COALESCE(NULLIF(p.kaspi_price, 0::numeric), p.sale_price) > 0::numeric THEN (COALESCE(NULLIF(p.kaspi_price, 0::numeric), p.sale_price) - p.cost_price) / COALESCE(NULLIF(p.kaspi_price, 0::numeric), p.sale_price) * 100::numeric
            ELSE 0::numeric
        END AS margin_percent
   FROM products p
     LEFT JOIN stock_stats s ON s.product_id = p.id
     LEFT JOIN sales_stats ss ON ss.product_id = p.id
  WHERE p.archived = false;