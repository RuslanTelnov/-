import { config } from 'dotenv'
config({ path: '.env.local' })

import { MoySkladSync } from '../lib/sync/moy-sklad-sync'

async function run() {
    console.log('🚀 Starting forced PRODUCTS sync (active + archived)...')
    const sync = new MoySkladSync()

    const result = await sync.syncProducts()
    console.log('Sync Result:', result)

    console.log('✅ Done!')
}

run()
