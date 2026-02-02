
ALTER TABLE stock DROP CONSTRAINT IF EXISTS stock_product_id_key;
-- Also drop the index if it exists separately (usually implied by constraint)
DROP INDEX IF EXISTS stock_product_id_key;

-- Add new composite unique constraint
ALTER TABLE stock ADD CONSTRAINT stock_product_id_store_id_key UNIQUE (product_id, store_id);
