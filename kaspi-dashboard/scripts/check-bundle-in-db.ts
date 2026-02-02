
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkBundle() {
    const bundleId = 'd8a68594-4212-11f0-0a80-107100117900'
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('moy_sklad_id', bundleId)

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Bundle in DB:', data)
    }
}

checkBundle()
