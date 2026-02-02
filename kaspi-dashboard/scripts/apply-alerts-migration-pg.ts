
import { Client } from 'pg'
import dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function runMigration() {
    console.log('🚀 Running alerts table migration (via pg)...')

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
        console.error('❌ DATABASE_URL not found in .env.local')
        process.exit(1)
    }

    const client = new Client({
        connectionString: dbUrl,
    })

    try {
        await client.connect()
        console.log('✅ Connected to database')

        const migrationPath = path.join(process.cwd(), 'supabase/migrations/create_alerts_table.sql')
        const sql = fs.readFileSync(migrationPath, 'utf-8')

        console.log('Executing SQL...')
        await client.query(sql)

        console.log('✅ Migration completed successfully!')

    } catch (error) {
        console.error('❌ Error running migration:', error)
        process.exit(1)
    } finally {
        await client.end()
    }
}

runMigration()
