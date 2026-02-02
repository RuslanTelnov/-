
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkAnalyticsView() {
    console.log('🔍 Checking Product Analytics View...')

    const { data: analytics, error } = await supabase
        .from('product_analytics')
        .select('*')
        .gt('sales_last_30_days', 0)
        .limit(5)

    if (error) {
        console.error('❌ Error fetching analytics:', error)
        return
    }

    console.log(`Found ${analytics?.length} items in analytics view`)
    if (analytics && analytics.length > 0) {
        console.log('Sample item:', analytics[0])
    }
}

checkAnalyticsView()
