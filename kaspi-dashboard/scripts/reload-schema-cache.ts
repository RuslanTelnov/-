
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function reloadSchema() {
    const { Client } = require('pg')
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    await client.connect()
    try {
        await client.query("NOTIFY pgrst, 'reload schema'")
        console.log('Sent NOTIFY pgrst, "reload schema"')
    } catch (e) {
        console.error('PG Error:', e)
    } finally {
        await client.end()
    }
}

reloadSchema()
