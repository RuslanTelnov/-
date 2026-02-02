-- Make article unique in products table
-- First, we might need to handle duplicates if they exist.
-- For now, we'll assume we can just add the constraint.
-- If this fails, we might need a cleanup script.

ALTER TABLE products 
ADD CONSTRAINT products_article_key UNIQUE (article);
