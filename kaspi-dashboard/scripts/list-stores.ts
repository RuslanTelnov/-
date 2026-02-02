
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function listStores() {
    console.log('🔍 Listing Stores...')
    const { data: stores, error } = await supabase
        .from('stores')
        .select('id, name, moy_sklad_id')

    if (error) {
        console.error('❌ Error fetching stores:', error)
        return
    }

    console.log('Stores found:')
    stores?.forEach(store => {
        console.log(`- [${store.name}] ID: ${store.id} (MS ID: ${store.moy_sklad_id})`)
    })
}

listStores()
