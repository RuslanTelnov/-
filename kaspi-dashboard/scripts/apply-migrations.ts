
import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

async function applyMigration() {
    console.log('Environment variables loaded:', {
        POSTGRES_URL: process.env.POSTGRES_URL ? 'Defined' : 'Undefined',
        DATABASE_URL: process.env.DATABASE_URL ? 'Defined' : 'Undefined',
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Defined' : 'Undefined'
    })

    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

    if (!connectionString) {
        console.error('❌ No database connection string found (POSTGRES_URL or DATABASE_URL)')
        // Fallback to localhost if nothing is defined, but log warning
        console.warn('⚠️ Defaulting to localhost connection string (might fail if DB is remote)')
    }

    const client = new Client({
        connectionString: connectionString || 'postgres://postgres:postgres@localhost:5432/postgres',
    })

    try {
        await client.connect()
        console.log('✅ Connected to database')

        const migrationPath = path.join(process.cwd(), 'supabase/migrations/agent_schema.sql')
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
