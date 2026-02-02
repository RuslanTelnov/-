import { MoySkladSync } from '../lib/sync/moy-sklad-sync'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function run() {
    console.log('🚀 Starting historical cost sync...')
    const { MoySkladSync } = await import('../lib/sync/moy-sklad-sync')
    const syncer = new MoySkladSync()
    await syncer.syncHistoricalCosts(365) // Sync last year
    console.log('✅ Done!')
}

run().catch(console.error)
