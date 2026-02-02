
-- Add positions column to customer_orders table
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS positions JSONB;
