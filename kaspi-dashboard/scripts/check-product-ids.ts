
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkProductIds() {
    console.log('Checking product IDs...')

    const targetId = 'ae83d366-2bc2-45a5-aa91-fd4ca29f3df1'

    const { data, error } = await supabase
        .from('products')
        .select('id, moy_sklad_id, name')
        .or(`id.eq.${targetId},moy_sklad_id.eq.${targetId}`)

    if (error) {
        console.error('Select Error:', error)
    } else {
        console.log('Product found:', data)
    }
}

checkProductIds()
