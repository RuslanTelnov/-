
ALTER TABLE money_by_account ADD COLUMN IF NOT EXISTS account_href TEXT;
ALTER TABLE money_by_account ADD COLUMN IF NOT EXISTS organization_name TEXT;
ALTER TABLE money_by_account ADD COLUMN IF NOT EXISTS organization_href TEXT;
