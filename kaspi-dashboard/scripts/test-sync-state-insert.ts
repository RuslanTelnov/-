import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const { Client } = require('pg');

async function testInsert() {
    console.log('Testing sync_state insert with PG...');

    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        ssl: false // Disable SSL for local
    });

    try {
        await client.connect();
        const startTime = new Date();
        const entityType = 'test_entity_pg';

        const res = await client.query(
            `INSERT INTO sync_state (entity_type, last_sync_start, last_sync_end, status, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (entity_type) DO UPDATE SET
       last_sync_start = EXCLUDED.last_sync_start,
       last_sync_end = EXCLUDED.last_sync_end,
       status = EXCLUDED.status,
       updated_at = EXCLUDED.updated_at
       RETURNING *`,
            [entityType, startTime.toISOString(), new Date().toISOString(), 'success', new Date().toISOString()]
        );

        console.log('✅ PG Insert Success:', res.rows[0]);
    } catch (err) {
        console.error('❌ PG Insert Error:', err);
    } finally {
        await client.end();
    }
}

testInsert();
