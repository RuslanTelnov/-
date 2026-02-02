
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFinancials() {
    console.log('Checking Financial Data...')

    // 1. Check money_by_account
    const { data: moneyData, error: moneyError } = await supabase
        .from('money_by_account')
        .select('*')
        .order('period_end', { ascending: false })
        .limit(5)

    if (moneyError) {
        console.error('Error fetching money_by_account:', moneyError)
    } else {
        console.log('Latest money_by_account entries:')
        console.table(moneyData)
    }

    // 2. Check payments_in sum
    const { data: paymentsIn, error: inError } = await supabase
        .from('payments_in')
        .select('sum')

    if (inError) {
        console.error('Error fetching payments_in:', inError)
    } else {
        const totalIn = paymentsIn?.reduce((sum, p) => sum + (p.sum || 0), 0) || 0
        console.log('Total Payments In:', totalIn)
    }

    // 3. Check payments_out sum
    const { data: paymentsOut, error: outError } = await supabase
        .from('payments_out')
        .select('sum')

    if (outError) {
        console.error('Error fetching payments_out:', outError)
    } else {
        const totalOut = paymentsOut?.reduce((sum, p) => sum + (p.sum || 0), 0) || 0
        console.log('Total Payments Out:', totalOut)
    }
}

checkFinancials()
