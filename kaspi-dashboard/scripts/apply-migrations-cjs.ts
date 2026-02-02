const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyMigration() {
    const migrationFile = 'supabase/migrations/add_performance_indexes.sql'
    const sql = fs.readFileSync(path.join(process.cwd(), migrationFile), 'utf8')

    console.log(`Applying migration: ${migrationFile}`)

    // Split by semicolon to run statements individually if needed, 
    // but Supabase RPC/query usually handles blocks. 
    // However, supabase-js client doesn't support raw SQL execution directly on public schema easily without RPC.
    // We can try to use the 'pg' library if we had connection string, but we only have URL/Key.
    // Wait, I can use the `rpc` if I have a `exec_sql` function, or I can try to use the `pg` client if I can construct the connection string.
    // The user's environment seems to have `pg` installed (based on previous errors).
    // Let's try to infer connection string or use a pre-existing `exec_sql` RPC if it exists.
    // If not, I'll use the `pg` library.

    // Constructing connection string from Supabase URL is tricky (need password).
    // Assuming I don't have the password.
    // I will check if there is an `exec_sql` function.

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
        console.error('RPC exec_sql failed:', error)
        console.log('Trying to use pg client directly if connection string is available...')
        // Fallback: I can't use pg without password.
        // I will try to create the exec_sql function first using a trick? No.
        // I'll assume the user has a way to run SQL or I'll try to use the `pg` client with a guessed connection string if it's in .env?
        // Usually .env.local has DATABASE_URL.
    } else {
        console.log('Migration applied successfully via RPC!')
    }
}

// Check for DATABASE_URL or POSTGRES_URL
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (connectionString) {
    const { Client } = require('pg')
    const client = new Client({
        connectionString,
        // ssl: { rejectUnauthorized: false } // Disable SSL for local/incompatible servers
    })

    async function runPg() {
        try {
            await client.connect()
            const migrationFile = 'supabase/migrations/add_sales_returns_and_cancelled.sql'
            const sql = fs.readFileSync(path.join(process.cwd(), migrationFile), 'utf8')
            await client.query(sql)
            console.log(`Migration ${migrationFile} applied successfully via PG client!`)
        } catch (e) {
            console.error('PG client error:', e)
        } finally {
            await client.end()
        }
    }
    runPg()
} else {
    console.log('DATABASE_URL not found, trying RPC...')
    applyMigration()
}
