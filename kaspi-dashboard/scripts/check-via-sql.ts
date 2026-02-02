import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkViaSql() {
    const client = new Client({
        connectionString: 'postgres://supabase_admin:your-super-secret-and-long-postgres-password@localhost:54322/postgres',
        ssl: false
    })

    try {
        await client.connect()
        console.log('✅ Connected to database')

        const tables = ['profit_by_product', 'turnover', 'sales', 'products', 'stock']

        for (const table of tables) {
            const result = await client.query(`SELECT COUNT(*) FROM ${table}`)
            console.log(`${table}: ${result.rows[0].count} rows`)
        }

        // Check profit_by_product sample
        const profitSample = await client.query('SELECT * FROM profit_by_product LIMIT 3')
        console.log('\nprofit_by_product sample:', JSON.stringify(profitSample.rows, null, 2))

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await client.end()
    }
}

checkViaSql()
