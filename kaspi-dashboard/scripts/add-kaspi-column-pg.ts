import { Client } from 'pg'
import { config } from 'dotenv'
config({ path: '.env.local' })

async function run() {
    console.log('🔌 Connecting to DB...')
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    })

    try {
        await client.connect()
        console.log('✅ Connected!')

        console.log('🛠 Adding kaspi_price column...')
        await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS kaspi_price double precision DEFAULT NULL;
    `)
        console.log('✅ Column added (or already exists)')

    } catch (err) {
        console.error('❌ Error:', err)
    } finally {
        await client.end()
    }
}

run()
