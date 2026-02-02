
-- Add columns for stock age analytics
ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS last_entry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS days_in_stock INTEGER;

COMMENT ON COLUMN stock.last_entry_date IS 'Date of the last entry/receipt of the product';
COMMENT ON COLUMN stock.days_in_stock IS 'Number of days the product has been in stock (calculated)';
