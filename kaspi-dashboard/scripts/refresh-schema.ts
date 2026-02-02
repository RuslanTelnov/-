
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function refreshSchema() {
    console.log('🔄 Refreshing Supabase schema cache...')
    // In Supabase, NOTIFY pgrst, 'reload schema' is used to refresh the PostgREST cache
    const { error } = await supabase.rpc('execute_sql', {
        sql_query: "NOTIFY pgrst, 'reload schema';"
    })

    if (error) {
        console.error('❌ Error refreshing schema via RPC:', error.message)
        console.log('💡 Note: If execute_sql is not found, you can manually run "NOTIFY pgrst, \'reload schema\';" in the Supabase SQL Editor.')
    } else {
        console.log('✅ Schema refresh signal sent successfully.')
    }
}

refreshSchema()
