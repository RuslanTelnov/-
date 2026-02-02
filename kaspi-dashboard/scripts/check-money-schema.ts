
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkMoneySchema() {
    console.log('Checking money_by_account columns...')

    // Try to insert a dummy row to see errors
    const { error } = await supabase
        .from('money_by_account')
        .insert({
            account_name: 'Test',
            account_type: 'test',
            balance: 100,
            income: 10,
            outcome: 5,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error('Insert Error:', error)
    } else {
        console.log('Insert Success (will delete now)')
        await supabase.from('money_by_account').delete().eq('account_name', 'Test')
    }
}

checkMoneySchema()
