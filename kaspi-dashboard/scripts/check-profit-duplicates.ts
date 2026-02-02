
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkDuplicates() {
    console.log('Checking for duplicates in profit_by_product...')

    const { data, error } = await supabase
        .from('profit_by_product')
        .select('product_id, period_start, period_end')

    if (error) {
        console.error('Error:', error)
        return
    }

    const counts = new Map<string, number>()
    data.forEach(item => {
        counts.set(item.product_id, (counts.get(item.product_id) || 0) + 1)
    })

    let duplicates = 0
    counts.forEach((count, id) => {
        if (count > 1) duplicates++
    })

    console.log(`Total records: ${data.length}`)
    console.log(`Unique products: ${counts.size}`)
    console.log(`Products with multiple records: ${duplicates}`)

    if (duplicates > 0) {
        console.log('Example duplicates:')
        let shown = 0
        for (const [id, count] of counts.entries()) {
            if (count > 1 && shown < 5) {
                console.log(`  Product ${id}: ${count} records`)
                shown++
            }
        }
    }
}

checkDuplicates()
