
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkFinanceSum() {
    console.log('Calculating Finance Sums...')

    // Sum Payments In
    const { data: incomeData, error: incomeError } = await supabase.rpc('get_payments_in_sum')
    // If RPC doesn't exist, we do it manually (less efficient but works for debugging)

    // Let's try manual sum with pagination if needed, or just simple query if dataset is small enough (8k is small)
    // Actually, let's use a simple query to get all sums and reduce in JS.

    // Income
    let totalIncome = 0
    let offset = 0
    while (true) {
        const { data, error } = await supabase
            .from('payments_in')
            .select('sum')
            .range(offset, offset + 999)

        if (error) {
            console.error('Income Error:', error)
            break
        }
        if (!data || data.length === 0) break

        totalIncome += data.reduce((acc, item) => acc + (item.sum || 0), 0)
        offset += 1000
    }

    // Outcome
    let totalOutcome = 0
    offset = 0
    while (true) {
        const { data, error } = await supabase
            .from('payments_out')
            .select('sum')
            .range(offset, offset + 999)

        if (error) {
            console.error('Outcome Error:', error)
            break
        }
        if (!data || data.length === 0) break

        totalOutcome += data.reduce((acc, item) => acc + (item.sum || 0), 0)
        offset += 1000
    }

    const balance = totalIncome - totalOutcome

    console.log(`Total Income: ${totalIncome.toLocaleString()} ₸`)
    console.log(`Total Outcome: ${totalOutcome.toLocaleString()} ₸`)
    console.log(`Calculated Balance: ${balance.toLocaleString()} ₸`)
}

checkFinanceSum()
