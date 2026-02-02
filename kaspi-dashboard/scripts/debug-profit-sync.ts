import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load env vars FIRST
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

async function debugProfitSync() {
    console.log('🚀 Starting profit sync debug...')

    // Dynamic imports
    const { MoySkladSync } = await import('../lib/sync/moy-sklad-sync')

    try {
        const sync = new MoySkladSync()

        // Period: last 30 days
        const periodEnd = new Date()
        const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000)

        console.log(`📅 Period: ${periodStart.toISOString()} - ${periodEnd.toISOString()}`)

        console.log('🔄 Calling syncProfitByProduct...')
        const result = await sync.syncProfitByProduct(
            periodStart.toISOString(),
            periodEnd.toISOString()
        )

        console.log('✅ Result:', JSON.stringify(result, null, 2))

        // Verify immediately
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { count, error } = await supabase.from('profit_by_product').select('*', { count: 'exact', head: true })
        console.log('🔍 Immediate Verification Count:', count)
        if (error) console.error('Verification Error:', error)

    } catch (error) {
        console.error('❌ Debug failed:', error)
    }
}

debugProfitSync()
