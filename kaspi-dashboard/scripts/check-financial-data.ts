import dotenv from 'dotenv'
import * as path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function checkFinancials() {
    console.log('💰 Checking Financial Data...\n')

    try {
        const { supabaseAdmin } = await import('../lib/supabase/server')

        // 1. Check money_by_account (Primary Source)
        const { data: mba, error: mbaError } = await supabaseAdmin
            .from('money_by_account')
            .select('*')
            .order('period_end', { ascending: false })
            .limit(1)

        if (mbaError) console.error('Error fetching money_by_account:', mbaError.message)
        else {
            console.log('=== money_by_account (Latest) ===')
            if (mba && mba.length > 0) {
                console.log(JSON.stringify(mba[0], null, 2))
            } else {
                console.log('No data found.')
            }
        }

        // 2. Check payments (Fallback Source)
        const { data: payIn, error: inError } = await supabaseAdmin.from('payments_in').select('sum')
        const { data: payOut, error: outError } = await supabaseAdmin.from('payments_out').select('sum')

        if (inError) console.error('Error fetching payments_in:', inError.message)
        if (outError) console.error('Error fetching payments_out:', outError.message)

        const totalIncome = (payIn as any[])?.reduce((sum, p) => sum + (p.sum || 0), 0) || 0
        const totalOutcome = (payOut as any[])?.reduce((sum, p) => sum + (p.sum || 0), 0) || 0

        console.log('\n=== Payments Calculation (Fallback) ===')
        console.log(`Total Income (payments_in): ${totalIncome.toLocaleString()}`)
        console.log(`Total Outcome (payments_out): ${totalOutcome.toLocaleString()}`)
        console.log(`Calculated Balance: ${(totalIncome - totalOutcome).toLocaleString()}`)

    } catch (e) {
        console.error('❌ Script Error:', e)
    }
}

checkFinancials()
