-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    name TEXT,
    description TEXT,
    article TEXT,
    code TEXT,
    uom_id UUID,
    group_id UUID,
    vat NUMERIC,
    effective_vat NUMERIC,
    discount_prohibited BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extra columns will be added by update_schema_from_n8n.sql
    category_id TEXT,
    buy_price NUMERIC,
    weight NUMERIC,
    volume NUMERIC,
    image_url TEXT,
    quantity_reserve NUMERIC DEFAULT 0,
    archived BOOLEAN DEFAULT false,
    modifications_count INTEGER DEFAULT 0,
    owner TEXT,
    disable_kaspi BOOLEAN DEFAULT false,
    disable_dumping BOOLEAN DEFAULT false,
    preorder_days INTEGER,
    cost_price NUMERIC DEFAULT 0,
    sale_price NUMERIC DEFAULT 0,
    moy_sklad_id TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS products_moy_sklad_id_idx ON products (moy_sklad_id);

-- Stores
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY,
    name TEXT,
    description TEXT,
    address TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extra columns
    account_id TEXT,
    shared BOOLEAN,
    code TEXT,
    external_code TEXT,
    archived BOOLEAN,
    address_addinfo TEXT,
    path_name TEXT,
    group_id TEXT,
    owner_id TEXT
);

-- Stock
CREATE TABLE IF NOT EXISTS stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    store_id UUID REFERENCES stores(id),
    stock NUMERIC DEFAULT 0,
    stock_days NUMERIC DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS stock_product_id_store_id_idx ON stock (product_id, store_id);

-- Customer Orders
CREATE TABLE IF NOT EXISTS customer_orders (
    id UUID PRIMARY KEY,
    name TEXT,
    description TEXT,
    moment TIMESTAMP WITH TIME ZONE,
    sum NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extra columns
    vat_sum NUMERIC,
    state_id TEXT,
    agent_id TEXT,
    organization_id TEXT,
    store_id TEXT,
    owner_id TEXT,
    group_id TEXT,
    rate_currency TEXT,
    rate_value NUMERIC,
    rate_multiplier NUMERIC,
    printed BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT false,
    deleted TIMESTAMP WITH TIME ZONE
);

-- Turnover
CREATE TABLE IF NOT EXISTS turnover (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extra columns
    uom_name TEXT,
    uom_href TEXT,
    image_href TEXT,
    image_title TEXT,
    image_filename TEXT,
    image_updated TEXT,
    image_tiny_href TEXT,
    image_miniature_href TEXT,
    assortment_href TEXT,
    assortment_type TEXT,
    on_period_start_quantity NUMERIC,
    on_period_start_sum NUMERIC,
    income_quantity NUMERIC,
    income_sum NUMERIC,
    outcome_quantity NUMERIC,
    outcome_sum NUMERIC,
    on_period_end_quantity NUMERIC,
    on_period_end_sum NUMERIC
);

-- Profit by Product
CREATE TABLE IF NOT EXISTS profit_by_product (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    moment TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extra columns
    uom_name TEXT,
    image_url TEXT,
    sell_quantity NUMERIC,
    sell_price NUMERIC,
    sell_cost NUMERIC,
    sell_sum NUMERIC,
    sell_cost_sum NUMERIC,
    return_quantity NUMERIC,
    return_price NUMERIC,
    return_cost NUMERIC,
    return_sum NUMERIC,
    return_cost_sum NUMERIC,
    sales_margin NUMERIC
);

-- Money by Account
CREATE TABLE IF NOT EXISTS money_by_account (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID,
    moment TIMESTAMP WITH TIME ZONE,
    sum NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extra columns
    organization_name TEXT,
    organization_href TEXT,
    account_href TEXT
);

-- Payments In
CREATE TABLE IF NOT EXISTS payments_in (
    id UUID PRIMARY KEY,
    name TEXT,
    moment TIMESTAMP WITH TIME ZONE,
    sum NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extra columns
    incoming_number TEXT,
    incoming_date TIMESTAMP WITH TIME ZONE,
    vat_sum NUMERIC,
    rate_currency TEXT,
    rate_value NUMERIC,
    rate_multiplier NUMERIC,
    agent_id TEXT,
    organization_id TEXT,
    group_id TEXT,
    owner_id TEXT,
    state_name TEXT,
    state_id TEXT,
    operations TEXT
);

-- Payments Out
CREATE TABLE IF NOT EXISTS payments_out (
    id UUID PRIMARY KEY,
    name TEXT,
    moment TIMESTAMP WITH TIME ZONE,
    sum NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extra columns
    incoming_number TEXT,
    incoming_date TIMESTAMP WITH TIME ZONE,
    vat_sum NUMERIC,
    rate_currency TEXT,
    rate_value NUMERIC,
    rate_multiplier NUMERIC,
    agent_id TEXT,
    organization_id TEXT,
    group_id TEXT,
    owner_id TEXT,
    state_name TEXT,
    state_id TEXT,
    operations TEXT
);

-- Cash In
CREATE TABLE IF NOT EXISTS cash_in (
    id UUID PRIMARY KEY,
    name TEXT,
    moment TIMESTAMP WITH TIME ZONE,
    sum NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extra columns
    incoming_number TEXT,
    incoming_date TIMESTAMP WITH TIME ZONE,
    organization_id TEXT,
    agent_id TEXT,
    state_name TEXT,
    state_id TEXT,
    rate_currency TEXT,
    rate_value NUMERIC,
    rate_multiplier NUMERIC,
    group_id TEXT,
    owner_id TEXT
);

-- Cash Out
CREATE TABLE IF NOT EXISTS cash_out (
    id UUID PRIMARY KEY,
    name TEXT,
    moment TIMESTAMP WITH TIME ZONE,
    sum NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extra columns
    incoming_number TEXT,
    incoming_date TIMESTAMP WITH TIME ZONE,
    organization_id TEXT,
    agent_id TEXT,
    state_name TEXT,
    state_id TEXT,
    rate_currency TEXT,
    rate_value NUMERIC,
    rate_multiplier NUMERIC,
    group_id TEXT,
    owner_id TEXT
);

-- Losses
CREATE TABLE IF NOT EXISTS losses (
    id UUID PRIMARY KEY,
    name TEXT,
    moment TIMESTAMP WITH TIME ZONE,
    sum NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extra columns
    account_id TEXT,
    owner TEXT,
    shared BOOLEAN DEFAULT false,
    group_id TEXT,
    updated TIMESTAMP WITH TIME ZONE,
    description TEXT,
    external_code TEXT,
    applicable BOOLEAN DEFAULT false,
    store TEXT,
    organization TEXT,
    created TIMESTAMP WITH TIME ZONE,
    printed BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT false,
    inventory TEXT,
    project TEXT
);

-- Reload schema cache
NOTIFY pgrst, 'reload config';
