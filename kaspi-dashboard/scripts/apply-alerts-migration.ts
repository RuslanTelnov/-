
import dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables first
dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runMigration() {
    console.log('🚀 Running alerts table migration...')

    const migrationPath = path.join(process.cwd(), 'supabase/migrations/create_alerts_table.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    try {
        // Split by semicolons and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'))

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`)
            const { error } = await (supabaseAdmin as any).rpc('exec_sql', { sql_query: statement })

            if (error) {
                console.error('❌ Migration failed:', error)
                throw error
            }
        }

        console.log('✅ Migration completed successfully!')

    } catch (error) {
        console.error('❌ Error running migration:', error)
        process.exit(1)
    }
}

runMigration()
