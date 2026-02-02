import dotenv from 'dotenv'
import * as path from 'path'

// Load env vars before anything else
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function checkView() {
    try {
        // Dynamic import to ensure env vars are loaded
        const { supabaseAdmin } = await import('../lib/supabase/server')

        const { error } = await supabaseAdmin.from('dashboard_stats').select('*').limit(1)
        if (error) {
            console.log('View does not exist or error:', error.message)
        } else {
            console.log('Success: View exists')
        }
    } catch (e) {
        console.log('Error:', e)
    }
}

checkView()
