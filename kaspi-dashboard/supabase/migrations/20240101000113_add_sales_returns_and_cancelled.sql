-- Create sales_returns table
CREATE TABLE IF NOT EXISTS sales_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moy_sklad_id UUID UNIQUE NOT NULL,
  moment TIMESTAMP WITH TIME ZONE NOT NULL,
  sum NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_cancelled to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sales_returns_moment ON sales_returns(moment);
CREATE INDEX IF NOT EXISTS idx_sales_is_cancelled ON sales(is_cancelled);
