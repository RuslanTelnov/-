import dotenv from 'dotenv'
import * as path from 'path'
import { MoySkladSync } from '../lib/sync/moy-sklad-sync'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function debugStockSync() {
    console.log('📦 Debugging Stock Sync...\n')

    try {
        const { MoySkladSync } = await import('../lib/sync/moy-sklad-sync')
        const sync = new MoySkladSync()

        // 1. Check API connection and raw data
        console.log('Fetching stock from MoySklad API...')
        // We'll call the internal client method directly if possible, or just run syncStock and watch logs
        // Since we can't easily access private properties, we'll run the public method

        const result = await sync.syncStock()
        console.log('Sync Result:', result)

    } catch (e) {
        console.error('❌ Script Error:', e)
    }
}

debugStockSync()
