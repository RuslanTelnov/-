
DROP TABLE IF EXISTS profit_by_product;

CREATE TABLE profit_by_product (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    article TEXT,
    moment TIMESTAMP WITH TIME ZONE,
    uom_name TEXT,
    image_url TEXT,
    sell_quantity NUMERIC DEFAULT 0,
    sell_price NUMERIC DEFAULT 0,
    sell_cost NUMERIC DEFAULT 0,
    sell_sum NUMERIC DEFAULT 0,
    sell_cost_sum NUMERIC DEFAULT 0,
    return_quantity NUMERIC DEFAULT 0,
    return_price NUMERIC DEFAULT 0,
    return_cost NUMERIC DEFAULT 0,
    return_sum NUMERIC DEFAULT 0,
    return_cost_sum NUMERIC DEFAULT 0,
    sales_margin NUMERIC DEFAULT 0,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, period_start, period_end)
);

-- Re-enable RLS
ALTER TABLE profit_by_product ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON profit_by_product FOR SELECT USING (true);
CREATE POLICY "Enable insert for service role" ON profit_by_product FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role" ON profit_by_product FOR UPDATE USING (true);
