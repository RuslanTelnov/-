
-- Add quantity column to customer_orders table
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 0;
