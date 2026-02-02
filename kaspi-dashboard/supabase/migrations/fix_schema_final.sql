-- Final Schema Fixes for Kaspi Dashboard
-- This script adds missing columns required by the frontend

-- Add kaspi_price column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS kaspi_price DECIMAL(10, 2) DEFAULT 0;

-- Add kaspi_price_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS kaspi_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    kaspi_price DECIMAL(10, 2),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kaspi_price_history_product_id ON kaspi_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_kaspi_price_history_changed_at ON kaspi_price_history(changed_at DESC);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
