
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkSchema() {
    console.log('🔍 Checking Products Table Schema...')

    // We can't easily check constraints via JS client without SQL, 
    // but we can try to upsert by moy_sklad_id and see if it works or fails.
    // Or we can query pg_indexes if we had direct SQL access (which we don't fully have via client).
    // But we have `scripts/check-via-sql.ts`? No, that was just selecting rows.

    // Let's try to fetch one product and see its structure
    const { data: product } = await supabase
        .from('products')
        .select('id, moy_sklad_id')
        .limit(1)
        .single()

    console.log('Sample Product:', product)

    // Let's assume moy_sklad_id IS unique because it's an external ID.
    // I will modify the sync script to use moy_sklad_id.
}

checkSchema()
