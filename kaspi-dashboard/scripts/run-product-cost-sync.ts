
import dotenv from 'dotenv'
import path from 'path'

// Load env before imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { MoySkladSync } from '../lib/sync/moy-sklad-sync'

async function runSync() {
    console.log('🚀 Starting Product Cost Sync...')
    const sync = new MoySkladSync()
    const result = await sync.syncProductCosts()
    console.log('Sync Result:', result)
}

runSync()
