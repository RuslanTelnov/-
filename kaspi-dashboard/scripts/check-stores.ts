
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkStores() {
    const { data: stores, error } = await supabase.from('stores').select('*')

    if (error) {
        console.error('Error checking stores:', error)
    } else {
        console.log('Stores:', JSON.stringify(stores, null, 2))
    }
}

checkStores()
