
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function inspectMoney() {
    console.log('Inspecting money_by_account...')

    const { data, error } = await supabase
        .from('money_by_account')
        .select('*')

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Rows:', data?.length)
        console.log('Data:', JSON.stringify(data, null, 2))
    }
}

inspectMoney()
