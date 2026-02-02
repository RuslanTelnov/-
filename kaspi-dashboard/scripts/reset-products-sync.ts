import dotenv from 'dotenv'
import * as path from 'path'
import { Client } from 'pg'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function resetSyncState() {
    console.log('🔄 Resetting sync state for products...\n')

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    })

    try {
        await client.connect()
        await client.query("DELETE FROM sync_state WHERE entity_type = 'products'")
        console.log('✅ Sync state for products reset. Next sync will be full.')
    } catch (error) {
        console.error('❌ Error resetting sync state:', error)
    } finally {
        await client.end()
    }
}

resetSyncState()
