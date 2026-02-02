
-- Add missing columns to customer_orders table
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS agent_name TEXT;
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS organization_name TEXT;
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS state_name TEXT;
