CREATE TABLE IF NOT EXISTS sync_state (
    entity_type TEXT PRIMARY KEY,
    last_sync_start TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
