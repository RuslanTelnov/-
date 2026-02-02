
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkSyncStateSchema() {
    console.log('🔍 Checking Sync State Schema...')

    const { data: state, error } = await supabase
        .from('sync_state')
        .select('*')
        .limit(1)

    if (error) {
        console.error('❌ Error fetching sync_state:', error)
        return
    }

    if (state && state.length > 0) {
        console.log('Sync State columns:', Object.keys(state[0]))
    } else {
        console.log('Sync State table is empty.')
    }
}

checkSyncStateSchema()
