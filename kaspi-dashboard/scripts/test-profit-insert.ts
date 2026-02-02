
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testProfitInsert() {
    console.log('🧪 Testing Profit Insert...')

    const testRecord = {
        product_id: '00000000-0000-0000-0000-000000000000',
        article: 'TEST-123',
        moment: new Date().toISOString(),
        sell_quantity: 1,
        sell_sum: 100,
        sell_cost_sum: 50,
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
        .from('profit_by_product')
        .insert(testRecord)
        .select()

    if (error) {
        console.error('❌ Insert Error:', error)
    } else {
        console.log('✅ Insert Success:', data)

        // Cleanup
        await supabase.from('profit_by_product').delete().eq('article', 'TEST-123')
        console.log('🧹 Cleanup done')
    }
}

testProfitInsert()
