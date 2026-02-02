import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { getWarehouseName } from './lib/utils/warehouse'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkStores() {
    const { data: stores, error } = await supabase.from('stores').select('id, name')
    if (error) {
        console.error('Error fetching stores:', error)
        return
    }

    console.log('Stores found:', stores.length)
    stores.forEach(store => {
        const warehouseName = getWarehouseName(store.name)
        console.log(`Store: "${store.name}" -> Warehouse: "${warehouseName}" (ID: ${store.id})`)
    })
}

checkStores()
