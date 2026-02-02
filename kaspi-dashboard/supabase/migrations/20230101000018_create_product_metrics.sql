-- Create product_metrics table
-- This table stores calculated business metrics for products

CREATE TABLE IF NOT EXISTS product_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article TEXT NOT NULL,
  product_name TEXT,
  
  -- Turnover metrics
  turnover_ratio NUMERIC DEFAULT 0,
  turnover_days NUMERIC DEFAULT 0,
  
  -- Margin metrics
  margin_percent NUMERIC DEFAULT 0,
  margin_amount NUMERIC DEFAULT 0,
  
  -- Liquidity metrics
  liquidity_score NUMERIC DEFAULT 0,
  sales_velocity NUMERIC DEFAULT 0,
  
  -- Revenue metrics
  total_revenue NUMERIC DEFAULT 0,
  avg_revenue_per_day NUMERIC DEFAULT 0,
  
  -- Stock metrics
  current_stock NUMERIC DEFAULT 0,
  avg_stock NUMERIC DEFAULT 0,
  
  -- Analysis
  recommendation TEXT,
  priority_score NUMERIC DEFAULT 0,
  
  -- Period tracking
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(article, period_start, period_end)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_metrics_article ON product_metrics(article);
CREATE INDEX IF NOT EXISTS idx_product_metrics_priority ON product_metrics(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_product_metrics_period ON product_metrics(period_end DESC);
CREATE INDEX IF NOT EXISTS idx_product_metrics_calculated ON product_metrics(calculated_at DESC);

-- Add comment
COMMENT ON TABLE product_metrics IS 'Calculated business metrics for products including turnover, margin, liquidity, and priority scores';
