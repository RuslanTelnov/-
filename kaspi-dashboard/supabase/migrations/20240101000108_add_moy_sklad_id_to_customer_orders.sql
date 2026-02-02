
-- Add moy_sklad_id column to customer_orders table
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS moy_sklad_id UUID;

-- Create unique index on moy_sklad_id to allow upsert
CREATE UNIQUE INDEX IF NOT EXISTS customer_orders_moy_sklad_id_idx ON customer_orders (moy_sklad_id);
