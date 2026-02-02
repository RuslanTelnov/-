
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function deleteStagnantAlert() {
    console.log('🗑️ Deleting old stagnant_stock alert...')
    const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('type', 'stagnant_stock')

    if (error) {
        console.error('❌ Error deleting alert:', error)
    } else {
        console.log('✅ Alert deleted.')
    }
}

deleteStagnantAlert()
