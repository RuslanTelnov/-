/**
 * Script to create product_metrics table
 * 
 * OPTION 1: Run via Supabase Dashboard
 * 1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
 * 2. Copy and paste the SQL from supabase/migrations/20251203_create_product_metrics.sql
 * 3. Click "Run"
 * 
 * OPTION 2: Run this script
 * Usage: npx tsx scripts/create-product-metrics-table.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load env
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTable() {
    console.log('🚀 Creating product_metrics table...')

    try {
        // First, try to query the table to see if it exists
        const { error: checkError } = await supabase
            .from('product_metrics')
            .select('id')
            .limit(1)

        if (!checkError) {
            console.log('✅ Table product_metrics already exists!')
            return
        }

        console.log('📝 Table does not exist, please create it manually:')
        console.log('\n' + '='.repeat(80))
        console.log('Go to: https://supabase.com/dashboard')
        console.log('Navigate to: SQL Editor')
        console.log('Copy and paste the SQL from:')
        console.log('  supabase/migrations/20251203_create_product_metrics.sql')
        console.log('='.repeat(80) + '\n')

        // Read and display the SQL
        const migrationPath = path.join(__dirname, '../supabase/migrations/20251203_create_product_metrics.sql')
        const sql = fs.readFileSync(migrationPath, 'utf-8')

        console.log('SQL to execute:')
        console.log(sql)

    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    }
}

createTable()
