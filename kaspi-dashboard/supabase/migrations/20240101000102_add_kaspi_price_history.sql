-- Create table for tracking Kaspi price history
CREATE TABLE IF NOT EXISTS kaspi_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('xml', 'order', 'manual')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_kaspi_price_history_product_id ON kaspi_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_kaspi_price_history_created_at ON kaspi_price_history(created_at);

-- Comment
COMMENT ON TABLE kaspi_price_history IS 'Historical record of Kaspi prices from XML feed and Order history';
