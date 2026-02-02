-- Create table for storing API endpoints documentation
CREATE TABLE IF NOT EXISTS api_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service TEXT NOT NULL,
    name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'GET',
    description TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    response_structure JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE api_endpoints IS 'Documentation of external API endpoints for AI agent usage';

-- Insert MoySklad endpoints
INSERT INTO api_endpoints (service, name, endpoint, method, description, parameters) VALUES
('moysklad', 'Get Products', '/entity/product', 'GET', 'Получить список товаров (номенклатуры)', '{"limit": "number", "offset": "number", "filter": "string"}'),
('moysklad', 'Get Stock', '/report/stock/all', 'GET', 'Получить остатки товаров', '{"limit": "number", "offset": "number", "store.id": "string"}'),
('moysklad', 'Get Sales', '/entity/demand', 'GET', 'Получить список отгрузок (продаж)', '{"limit": "number", "offset": "number", "momentFrom": "string", "momentTo": "string"}'),
('moysklad', 'Get Customer Orders', '/entity/customerorder', 'GET', 'Получить заказы покупателей', '{"limit": "number", "offset": "number"}'),
('moysklad', 'Get Counterparties', '/entity/counterparty', 'GET', 'Получить контрагентов', '{"limit": "number", "offset": "number"}'),
('moysklad', 'Get Stores', '/entity/store', 'GET', 'Получить список складов', '{"limit": "number", "offset": "number"}'),
('moysklad', 'Get Profit', '/report/profit/byproduct', 'GET', 'Получить отчет по прибыльности', '{"momentFrom": "string", "momentTo": "string", "limit": "number", "offset": "number"}');
