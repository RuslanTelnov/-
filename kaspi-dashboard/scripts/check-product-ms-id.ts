
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkProductMsId() {
    console.log('🔍 Checking Product MS ID...')

    const { data: product } = await supabase
        .from('products')
        .select('id, name, moy_sklad_id')
        .eq('name', 'Dahao порошок от тараканов 1 шт')
        .single()

    console.log('Product in DB:', product)
    console.log('Expected MS ID: f827e287-064f-11f0-0a80-11e20021e37e')
}

checkProductMsId()
