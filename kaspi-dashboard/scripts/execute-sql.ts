import { Client } from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

async function executeSql() {
    let connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        console.log('⚠️ DATABASE_URL not found in environment variables.')
        console.log('🔄 Trying default local Supabase credentials...')
        connectionString = 'postgres://supabase_admin:your-super-secret-and-long-postgres-password@localhost:54322/postgres'
    }

    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')

    const client = new Client({
        connectionString,
        ssl: isLocal ? false : { rejectUnauthorized: false }
    })

    try {
        await client.connect()
        console.log('✅ Connected to database')

        // Read migration files from args or default
        const files = process.argv.slice(2)
        if (files.length === 0) {
            console.error('❌ No migration files specified')
            process.exit(1)
        }

        for (const file of files) {
            const path = resolve(process.cwd(), file)
            const sql = readFileSync(path, 'utf-8')
            console.log(`Executing ${file}...`)
            await client.query(sql)
            console.log(`✅ Executed ${file}`)
        }

    } catch (error) {
        console.error('❌ Error executing SQL:', error)
        process.exit(1)
    } finally {
        await client.end()
    }
}

executeSql()
