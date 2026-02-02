
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
    console.log('Testing Supabase Client...')
    const { data, error } = await supabase
        .from('product_analytics')
        .select('article, cost_price')
        .eq('article', '112459527')

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Data:', data)
    }
}

run()
