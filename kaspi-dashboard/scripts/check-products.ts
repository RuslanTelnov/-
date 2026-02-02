
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkProducts() {
    console.log('Checking products table...')

    // Check total count
    const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

    console.log(`Total products in DB: ${count}`)
    if (countError) console.error('Count error:', countError)

    // Check archived status
    const { data: sample, error: sampleError } = await supabase
        .from('products')
        .select('id, name, archived')
        .limit(5)

    console.log('Sample products:', sample)
    if (sampleError) console.error('Sample error:', sampleError)

    // Check query with filter
    const { count: activeCount, error: activeError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('archived', false)

    console.log(`Active products (archived=false): ${activeCount}`)
    if (activeError) console.error('Active error:', activeError)

    // Check if archived is null
    const { count: nullArchivedCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .is('archived', null)

    console.log(`Products with archived=null: ${nullArchivedCount}`)
}

checkProducts()
