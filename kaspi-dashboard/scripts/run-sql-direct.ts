import dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import postgres from 'postgres'

// Load environment variables
dotenv.config({ path: '.env.local' })

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!dbUrl) {
    console.error('❌ DATABASE_URL or POSTGRES_URL not found in .env.local')
    console.error('Please add the connection string to .env.local to run migrations automatically.')
    process.exit(1)
}

const sql = postgres(dbUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1
})

async function runSqlFile(filePath: string) {
    console.log(`\n🚀 Executing ${path.basename(filePath)}...`)
    const content = fs.readFileSync(filePath, 'utf-8')

    try {
        await sql.unsafe(content)
        console.log(`✅ Successfully executed ${path.basename(filePath)}`)
    } catch (error) {
        console.error(`❌ Error executing ${path.basename(filePath)}:`, error)
        throw error
    }
}

async function runMigrations() {
    try {
        await runSqlFile(path.join(__dirname, '../supabase/migrations/20251203_performance_indexes.sql'))
        await runSqlFile(path.join(__dirname, '../supabase/migrations/20251203_dashboard_views.sql'))

        console.log('\n🎉 All migrations completed successfully!')
    } catch (error) {
        console.error('\n❌ Migration failed.')
        process.exit(1)
    } finally {
        await sql.end()
    }
}

runMigrations()
