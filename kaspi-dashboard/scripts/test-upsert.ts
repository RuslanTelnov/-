
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUpsert() {
    console.log('Testing upsert...')
    const id = 'b2326ff6-5359-11f0-0a80-1a300010df91'
    const costPrice = 123.45

    const { data, error } = await supabase
        .from('products')
        .update({ cost_price: costPrice })
        .eq('id', id)
        .select()

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Success:', data)
    }
}

testUpsert()
