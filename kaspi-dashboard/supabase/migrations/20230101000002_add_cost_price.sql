-- Add cost_price column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;

COMMENT ON COLUMN products.cost_price IS 'Себестоимость (закупка + доп. расходы)';
