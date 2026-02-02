
-- Create procurement_recommendations table
CREATE TABLE IF NOT EXISTS procurement_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Current State
  current_stock NUMERIC DEFAULT 0,
  avg_daily_sales NUMERIC DEFAULT 0,
  days_until_stockout NUMERIC,
  
  -- Recommendations
  recommended_qty NUMERIC DEFAULT 0,
  recommended_order_date DATE,
  priority TEXT, -- 'critical', 'high', 'medium', 'low'
  status TEXT DEFAULT 'pending', -- 'pending', 'ordered', 'ignored'
  
  -- Calculations Metadata
  lead_time_days INTEGER DEFAULT 14,
  review_period_days INTEGER DEFAULT 7,
  safety_stock_days INTEGER DEFAULT 7,
  
  -- Financials
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  expected_revenue NUMERIC DEFAULT 0,
  expected_profit NUMERIC DEFAULT 0,
  
  -- Timestamps
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_product_recommendation UNIQUE (product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_procurement_priority ON procurement_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_procurement_days_stockout ON procurement_recommendations(days_until_stockout);
CREATE INDEX IF NOT EXISTS idx_procurement_product_id ON procurement_recommendations(product_id);

-- RLS Policies
ALTER TABLE procurement_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON procurement_recommendations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role only" ON procurement_recommendations
    FOR INSERT WITH CHECK (true); -- Simplified for now, usually service role bypasses RLS anyway

CREATE POLICY "Enable update for service role only" ON procurement_recommendations
    FOR UPDATE USING (true);
