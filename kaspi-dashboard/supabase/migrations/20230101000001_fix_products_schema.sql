-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS moy_sklad_id TEXT,
ADD COLUMN IF NOT EXISTS external_code TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC,
ADD COLUMN IF NOT EXISTS sale_price NUMERIC;

-- Create unique index on moy_sklad_id if not exists
CREATE UNIQUE INDEX IF NOT EXISTS products_moy_sklad_id_idx ON products (moy_sklad_id);

-- Create unique index on article if not exists
CREATE UNIQUE INDEX IF NOT EXISTS products_article_idx ON products (article);

-- Reload schema cache
NOTIFY pgrst, 'reload config';
