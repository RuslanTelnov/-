import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkMainWarehouse() {
    console.log('🔍 Checking Main Warehouse Prices...')

    // 1. Get Main Warehouse ID
    const { data: stores } = await supabase
        .from('stores')
        .select('id, name')
        .eq('name', 'Основной склад')
        .single()

    if (!stores) {
        console.error('❌ Main Warehouse not found')
        return
    }

    console.log(`🏭 Found Warehouse: ${stores.name} (${stores.id})`)

    // 2. Get Stock items for this warehouse
    const { data: stockItems } = await supabase
        .from('stock')
        .select(`
      quantity,
      product:products (
        id,
        name,
        article,
        code,
        kaspi_price,
        cost_price,
        sale_price,
        image_url
      )
    `)
        .eq('store_id', stores.id)
        .gt('quantity', 0)
        .limit(20)

    if (!stockItems || stockItems.length === 0) {
        console.log('⚠️ No stock items found for this warehouse')
        return
    }

    console.log(`📦 Found ${stockItems.length} stock items (sample 20). Checking prices and images:`)

    let withKaspiPrice = 0
    let withImage = 0
    stockItems.forEach((item: any) => {
        const p = item.product
        const hasKaspi = p.kaspi_price > 0
        const hasImage = !!p.image_url
        if (hasKaspi) withKaspiPrice++
        if (hasImage) withImage++

        console.log(`- [${hasKaspi ? '✅' : '❌'}] ${p.name.substring(0, 30)}...`)
        console.log(`    Kaspi: ${p.kaspi_price}, Image: ${hasImage ? '✅' : '❌'}`)
    })

    console.log(`\n📊 Summary:`)
    console.log(`   Kaspi Price: ${withKaspiPrice}/${stockItems.length}`)
    console.log(`   Images: ${withImage}/${stockItems.length}`)
}

checkMainWarehouse()
