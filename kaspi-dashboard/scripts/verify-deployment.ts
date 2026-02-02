import dotenv from 'dotenv'
import * as path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function verifyDeployment() {
    console.log('🔍 Verifying Project Deployment...\n')

    try {
        const { supabaseAdmin } = await import('../lib/supabase/server')

        // 1. Check product_metrics table
        process.stdout.write('1. Checking table "product_metrics"... ')
        const { error: metricsError } = await supabaseAdmin.from('product_metrics').select('id').limit(1)
        if (metricsError && metricsError.code === '42P01') {
            console.log('❌ MISSING (Table not found)')
        } else if (metricsError) {
            console.log(`⚠️ Error: ${metricsError.message}`)
        } else {
            console.log('✅ FOUND')
        }

        // 2. Check dashboard_stats view
        process.stdout.write('2. Checking view "dashboard_stats"... ')
        const { error: viewError } = await supabaseAdmin.from('dashboard_stats').select('*').limit(1)
        if (viewError && viewError.code === '42P01') {
            console.log('❌ MISSING (View not found)')
        } else if (viewError) {
            console.log(`⚠️ Error: ${viewError.message}`)
        } else {
            console.log('✅ FOUND')
        }

        // 3. Check Telegram Config
        process.stdout.write('3. Checking Telegram Config... ')
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            console.log('✅ FOUND (in .env.local)')
        } else {
            console.log('❌ MISSING (Add to .env.local)')
        }

        console.log('\n---------------------------------------------------')
        console.log('ℹ️  Connection Info:')
        console.log(`   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)

    } catch (e) {
        console.error('❌ Script Error:', e)
    }
}

verifyDeployment()
