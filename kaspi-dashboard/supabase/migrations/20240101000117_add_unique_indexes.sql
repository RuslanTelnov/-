-- Add missing period columns to profit_by_product
ALTER TABLE profit_by_product 
ADD COLUMN IF NOT EXISTS period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS article TEXT;

-- Add missing period columns to turnover
ALTER TABLE turnover 
ADD COLUMN IF NOT EXISTS period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS article TEXT;

-- Add unique indexes for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS profit_by_product_product_period_idx 
ON profit_by_product (product_id, period_start, period_end);

CREATE UNIQUE INDEX IF NOT EXISTS turnover_product_period_idx 
ON turnover (product_id, period_start, period_end);

-- Reload schema
NOTIFY pgrst, 'reload config';
