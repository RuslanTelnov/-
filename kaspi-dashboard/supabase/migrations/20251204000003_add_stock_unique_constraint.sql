-- Add unique constraint for stock upsert
ALTER TABLE stock ADD CONSTRAINT stock_product_store_unique UNIQUE (product_id, store_id);
