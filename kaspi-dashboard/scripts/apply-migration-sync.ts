
const { Client } = require('pg')
const fs = require('fs')
const pathModule = require('path')
const dotenvModule = require('dotenv')

// Load environment variables
dotenvModule.config({ path: pathModule.resolve(__dirname, '../.env.local') })

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString) {
    console.error('❌ Missing POSTGRES_URL or DATABASE_URL')
    process.exit(1)
}

async function applyMigration() {
    console.log('🔄 Applying migration...')

    const client = new Client({
        connectionString,
    })

    try {
        await client.connect()
        console.log('✅ Connected to database')

        const migrationPath = pathModule.resolve(__dirname, '../supabase/migrations/create_sync_state.sql')
        const sql = fs.readFileSync(migrationPath, 'utf8')

        await client.query(sql)
        console.log('✅ Migration applied successfully')

    } catch (error) {
        console.error('❌ Error applying migration:', error)
    } finally {
        await client.end()
    }
}

applyMigration()

export { }
