
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkSchemas() {
    console.log('🔍 Checking Schemas...')

    // Check product_metrics
    const { data: metrics } = await supabase.from('product_metrics').select('*').limit(1)
    console.log('Product Metrics Sample:', metrics?.[0])

    // Check profit_by_product
    const { data: profit } = await supabase.from('profit_by_product').select('*').limit(1)
    console.log('Profit Sample:', profit?.[0])

    // Check sales (again, just to be sure)
    const { data: sales } = await supabase.from('sales').select('*').limit(1)
    console.log('Sales Sample:', sales?.[0])
}

checkSchemas()
