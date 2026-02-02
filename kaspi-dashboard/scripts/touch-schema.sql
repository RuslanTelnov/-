COMMENT ON COLUMN products.cost_price IS 'Updated comment to trigger schema reload';
NOTIFY pgrst, 'reload schema';
