
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function fixSyncState() {
    const { Client } = require('pg')
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    await client.connect()
    try {
        await client.query('ALTER TABLE sync_state ADD COLUMN IF NOT EXISTS last_sync_end TIMESTAMP WITH TIME ZONE;')
        console.log('Added last_sync_end column via PG.')
    } catch (e) {
        console.error('PG Error:', e)
    } finally {
        await client.end()
    }
}

fixSyncState()
