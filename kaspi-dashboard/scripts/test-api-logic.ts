const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
    console.log('Fetching from product_analytics...')
    const { data, error } = await supabase
        .from('product_analytics')
        .select('*')
        .eq('article', '118695083')

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Data:', data)
    }
}

run()
