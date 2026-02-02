
require('dotenv').config({ path: '.env.local' })
const { createClient: createClient2 } = require('@supabase/supabase-js')

const supabase = createClient2(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function addIsBundleColumn() {
    const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT FALSE;
    `
    })

    if (error) {
        console.error('Error adding is_bundle column:', error)
        // Fallback to direct SQL via pg if RPC fails (which it might if execute_sql not installed)
        const { Client } = require('pg')
        const client = new Client({
            connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        })
        await client.connect()
        try {
            await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT FALSE;')
            console.log('Added is_bundle column via PG.')
        } catch (e) {
            console.error('PG Error:', e)
        } finally {
            await client.end()
        }
    } else {
        console.log('Added is_bundle column via RPC.')
    }
}

addIsBundleColumn()
