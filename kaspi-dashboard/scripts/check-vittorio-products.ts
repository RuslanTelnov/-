
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkVittorioProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('name, price, description')
        .ilike('name', '%Legend%')
        .limit(5)

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Found products:', data)
    }
}

checkVittorioProducts()
