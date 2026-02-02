
-- Add days_in_stock as a generated column mirroring stock_days
-- This provides backward compatibility for frontend clients requesting the old column name
ALTER TABLE stock ADD COLUMN IF NOT EXISTS days_in_stock NUMERIC GENERATED ALWAYS AS (stock_days) STORED;
