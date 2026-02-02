
const { createClient } = require('@supabase/supabase-js')
const dotenvModule = require('dotenv')
const pathModule = require('path')

// Load environment variables
dotenvModule.config({ path: pathModule.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkFreshness() {
    console.log('🔍 Checking data freshness...')

    const tables = ['products', 'stock', 'sales', 'customer_orders']

    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('updated_at')
            .order('updated_at', { ascending: false })
            .limit(1)

        if (error) {
            console.error(`❌ Error checking ${table}:`, error.message)
            continue
        }

        if (data && data.length > 0) {
            const lastUpdate = new Date(data[0].updated_at)
            const now = new Date()
            const diffMinutes = Math.round((now.getTime() - lastUpdate.getTime()) / 60000)

            console.log(`✅ ${table}: Last updated ${lastUpdate.toISOString()} (${diffMinutes} mins ago)`)
        } else {
            console.log(`⚠️ ${table}: No data found`)
        }
    }
}

checkFreshness()

export { }
