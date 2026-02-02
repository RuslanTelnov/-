
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function syncAllProducts() {
    console.log('🚀 Starting Full Product Sync...')

    const { MoySkladSync } = await import('../lib/sync/moy-sklad-sync')
    const sync = new MoySkladSync()

    // Force sync to ignore last updated time
    const result = await sync.syncProducts(true)

    console.log('✅ Product Sync Result:', result)
}

syncAllProducts()
