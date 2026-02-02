import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkRpc() {
    const { data, error } = await supabase.rpc('execute_readonly_query', {
        query: 'SELECT 1'
    })

    if (error) {
        console.error('RPC Error:', error)
    } else {
        console.log('RPC Success:', data)
    }
}

checkRpc()
