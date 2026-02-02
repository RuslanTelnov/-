
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function manualUpdate() {
    console.log('🚀 Manual Update Cost...')
    const id = 'b66b770f-4af8-4822-8337-82a69365ee89'
    const cost = 20.20

    const { data, error } = await supabase
        .from('products')
        .update({ cost_price: cost })
        .eq('id', id)
        .select()

    if (error) {
        console.error('❌ Error updating:', error)
    } else {
        console.log('✅ Updated:', data)
    }
}

manualUpdate()
