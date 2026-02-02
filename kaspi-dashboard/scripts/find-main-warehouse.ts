const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function findMainWarehouse() {
    console.log('Searching for "Main Warehouse"...')

    const { data: warehouses, error } = await supabase
        .from('warehouses')
        .select('*')

    if (error) {
        console.error('Error fetching warehouses:', error)
        return
    }

    console.log('Found warehouses:', warehouses.length)
    warehouses.forEach((w: any) => {
        console.log(`- [${w.id}] ${w.name}`)
    })

    const mainWarehouse = warehouses.find((w: any) => w.name.toLowerCase().includes('основной') || w.name.toLowerCase().includes('main'))

    if (mainWarehouse) {
        console.log('\nPotential Main Warehouse:', mainWarehouse.name, 'ID:', mainWarehouse.id)
    } else {
        console.log('\nCould not identify "Main Warehouse" by name. Please check the list above.')
    }
}

findMainWarehouse()
