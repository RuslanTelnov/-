const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function applyMigration() {
    console.log('Environment variables loaded:', {
        POSTGRES_URL: process.env.POSTGRES_URL ? 'Defined' : 'Undefined',
        DATABASE_URL: process.env.DATABASE_URL ? 'Defined' : 'Undefined',
    })

    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

    if (!connectionString) {
        console.error('❌ No database connection string found')
        process.exit(1)
    }

    const client = new Client({
        connectionString: connectionString,
    })

    try {
        await client.connect()
        console.log('✅ Connected to database')

        const migrationPath = path.join(process.cwd(), 'supabase/migrations/sales_positions_schema.sql')
        const sql = fs.readFileSync(migrationPath, 'utf8')

        console.log('Running migration...')
        await client.query(sql)
        console.log('✅ Migration applied successfully')

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await client.end()
    }
}

applyMigration()
