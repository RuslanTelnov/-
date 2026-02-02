import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkSchema() {
    let connectionString = process.env.DATABASE_URL
    if (!connectionString) {
        connectionString = 'postgres://supabase_admin:your-super-secret-and-long-postgres-password@localhost:54322/postgres'
    }

    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    const sslConfig = isLocal ? false : { rejectUnauthorized: false }

    const client = new Client({
        connectionString,
        ssl: sslConfig
    })

    try {
        await client.connect()
        console.log('✅ Connected to database')

        // Check profit_by_product schema
        const profitSchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name IN ('stock', 'products')
      ORDER BY table_name, ordinal_position
    `)
        console.log('\nColumns for stock and products:')
        console.log(profitSchema.rows)

        // Check constraints
        const profitConstraints = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = 'profit_by_product'::regclass
    `)
        console.log('\nprofit_by_product constraints:')
        console.log(profitConstraints.rows)

        // Check indexes
        const profitIndexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'profit_by_product'
    `)
        console.log('\nprofit_by_product indexes:')
        console.log(profitIndexes.rows)

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await client.end()
    }
}

checkSchema()
