-- Add store_id column to stock table if it doesn't exist
ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);

-- Add unique constraint for product_id and store_id
ALTER TABLE stock
DROP CONSTRAINT IF EXISTS stock_product_id_store_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS stock_product_id_store_id_idx ON stock (product_id, store_id);
