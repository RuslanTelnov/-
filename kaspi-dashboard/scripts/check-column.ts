const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function checkColumn() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    })

    try {
        await client.connect()
        const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales' AND column_name = 'is_cancelled'
    `)

        if (res.rows.length > 0) {
            console.log('Column is_cancelled exists.')
        } else {
            console.log('Column is_cancelled DOES NOT exist.')
        }
    } catch (err) {
        console.error('Error:', err)
    } finally {
        await client.end()
    }
}

checkColumn()
