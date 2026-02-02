-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moy_sklad_id UUID UNIQUE,
    name TEXT,
    moment TIMESTAMP WITH TIME ZONE,
    sum NUMERIC,
    quantity NUMERIC,
    agent_name TEXT,
    organization_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on moment for filtering by period
CREATE INDEX IF NOT EXISTS sales_moment_idx ON sales (moment);
