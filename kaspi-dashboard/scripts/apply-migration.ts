
import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

async function applyMigration() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:54322/postgres',
    })

    try {
        await client.connect()
        console.log('✅ Connected to database')

        const migrationPath = path.join(process.cwd(), 'supabase/migrations/fix_alerts_rls.sql')
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
