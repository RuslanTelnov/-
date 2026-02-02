
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debugStagnant() {
    console.log('🔍 Debugging Stagnant Stock Logic...')

    // 1. Check Stock
    const { data: stockItems, error: stockError } = await supabase
        .from('stock')
        .select('product_id, stock, store_id')
        .gt('stock', 0)

    if (stockError) {
        console.error('❌ Error fetching stock:', stockError)
        return
    }

    console.log(`📊 Stock items > 0: ${stockItems?.length || 0}`)
    if (stockItems && stockItems.length > 0) {
        console.log('Sample stock item:', stockItems[0])
    }

    // 2. Check Sales
    const fortyFiveDaysAgo = new Date()
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45)
    console.log(`📅 Checking sales since: ${fortyFiveDaysAgo.toISOString()}`)

    const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*') // Revert to *
        .limit(1)

    if (salesError) {
        console.error('❌ Error fetching sales:', salesError)
        return
    }

    console.log(`📊 Sales sample (full row):`)
    console.log(salesData)

    // 3. Check Products
    if (stockItems && stockItems.length > 0) {
        const sampleProductId = stockItems[0].product_id
        const { data: product } = await supabase
            .from('products')
            .select('id, name, article')
            .eq('id', sampleProductId)
            .single()

        console.log(`📦 Sample product for stock item:`, product)
    }

    // 4. Full Logic Simulation
    if (stockItems && stockItems.length > 0) {
        console.log('🔄 Simulating full logic...')

        // Fetch ALL sales
        let allSales: any[] = []
        let page = 0
        const pageSize = 1000
        let hasMore = true

        while (hasMore) {
            const { data, error } = await supabase
                .from('sales')
                .select('name, moy_sklad_id') // Fetch moy_sklad_id too
                .gte('moment', fortyFiveDaysAgo.toISOString())
                .range(page * pageSize, (page + 1) * pageSize - 1)

            if (error || !data || data.length === 0) {
                hasMore = false
            } else {
                allSales = allSales.concat(data)
                if (data.length < pageSize) hasMore = false
                page++
            }
        }
        console.log(`📊 Total sales records fetched: ${allSales.length}`)

        const activeArticles = new Set(allSales.map(s => s.name))
        console.log(`📊 Unique active articles (from sales.name): ${activeArticles.size}`)
        if (activeArticles.size > 0) {
            console.log('Sample active articles:', Array.from(activeArticles).slice(0, 5))
        }

        // Fetch products for stock
        const productIds = Array.from(new Set(stockItems.map(s => s.product_id)))
        // Batch fetch products
        const batchSize = 50
        let products: any[] = []

        for (let i = 0; i < productIds.length; i += batchSize) {
            const batch = productIds.slice(i, i + batchSize)
            const { data: batchProducts, error: batchError } = await supabase
                .from('products')
                .select('*')
                .in('id', batch)

            if (batchError) {
                console.error('❌ Error fetching products batch:', batchError)
            } else if (batchProducts) {
                products = products.concat(batchProducts)
            }
        }

        if (products.length > 0) {
            console.log('Sample full product:', products[0])
        }

        console.log(`📊 Products fetched for stock: ${products?.length || 0}`)

        const productMap = new Map(products?.map(p => [p.id, p]))

        let stagnantCount = 0
        let skippedNoArticle = 0
        let matchedActive = 0
        let missingProduct = 0

        for (const item of stockItems) {
            const product = productMap.get(item.product_id)
            if (!product) {
                missingProduct++
                continue
            }

            if (!product.article) {
                skippedNoArticle++
                continue
            }

            if (activeArticles.has(product.article)) {
                matchedActive++
            } else {
                stagnantCount++
            }
        }

        console.log(`\n=== RESULTS ===`)
        console.log(`Total Stock Items: ${stockItems.length}`)
        console.log(`Missing Product in Map: ${missingProduct}`)
        console.log(`Skipped (No Article): ${skippedNoArticle}`)
        console.log(`Matched Active Sales: ${matchedActive}`)
        console.log(`Stagnant (No Sales): ${stagnantCount}`)

        // Check for ANY match
        console.log('\n🔍 Checking for ANY match between sales.name and product fields...')
        const salesNames = Array.from(activeArticles).slice(0, 20)
        console.log('Sample Sales Names:', salesNames)

        const { data: potentialMatches } = await supabase
            .from('products')
            .select('name, article, code')
            .or(`article.in.(${salesNames.map(n => `"${n}"`).join(',')}),code.in.(${salesNames.map(n => `"${n}"`).join(',')})`)
            .limit(5)

        console.log('Potential matches found in products:', potentialMatches)

        // Deep search for sales name in ALL columns of products
        console.log('\n🔍 Deep search for sales name in ALL columns...')
        const sampleName = salesNames[0]
        if (sampleName) {
            console.log(`Searching for "${sampleName}" in products...`)
            // We can't easily search all columns with Supabase client without knowing column names or using RPC.
            // Let's try a few likely candidates: code, article, external_code, name, description
            const { data: deepMatches } = await supabase
                .from('products')
                .select('*')
                .or(`name.ilike.%${sampleName}%,article.ilike.%${sampleName}%,code.ilike.%${sampleName}%,external_code.ilike.%${sampleName}%`)
                .limit(5)

            console.log('Deep matches:', deepMatches)
        }

        // Check matching via moy_sklad_id
        console.log('\n🔍 Checking matching via moy_sklad_id...')
        const salesMoySkladIds = new Set(allSales.map(s => s.moy_sklad_id).filter(id => id))
        console.log(`Unique sales moy_sklad_ids: ${salesMoySkladIds.size}`)

        let matchedByMoySkladId = 0
        for (const item of stockItems) {
            const product = productMap.get(item.product_id)
            if (!product || !product.moy_sklad_id) continue

            if (salesMoySkladIds.has(product.moy_sklad_id)) {
                matchedByMoySkladId++
            }
        }
        console.log(`Matched by moy_sklad_id: ${matchedByMoySkladId}`)
        // Check profit_by_product history
        console.log('\n🔍 Checking profit_by_product history...')
        const { data: profitHistory } = await supabase
            .from('profit_by_product')
            .select('moment, period_start, period_end')
            .order('moment', { ascending: true })
            .limit(5)

        console.log('Profit by product history sample:', profitHistory)

        // Count distinct moments
        const { data: moments } = await supabase
            .from('profit_by_product')
            .select('moment')

        const uniqueMoments = new Set(moments?.map(m => m.moment))
        console.log(`Unique moments in profit_by_product: ${uniqueMoments.size}`)
        console.log('Moments:', Array.from(uniqueMoments))

        // Check for 0 sales in profit_by_product
        const { count: zeroSalesCount } = await supabase
            .from('profit_by_product')
            .select('*', { count: 'exact', head: true })
            .eq('sell_quantity', 0)

        console.log(`Rows with 0 sales in profit_by_product: ${zeroSalesCount}`)
        // Check matching via product_id - SKIPPED because column doesn't exist
        console.log('\n🔍 Checking matching via product_id... SKIPPED (column missing)')
        /*
        // Fetch sales with product_id
        const { data: salesWithId } = await supabase
            .from('sales')
            .select('product_id')
            .gte('moment', fortyFiveDaysAgo.toISOString())
            .limit(1000)
            
        const activeProductIds = new Set(salesWithId?.map(s => s.product_id).filter(id => id))
        console.log(`Unique active product_ids in sales: ${activeProductIds.size}`)
        
        let matchedByProductId = 0
        for (const item of stockItems) {
            if (activeProductIds.has(item.product_id)) {
                matchedByProductId++
            }
        }
        console.log(`Matched by product_id: ${matchedByProductId}`)
        */

        // Check Alerts Table
        console.log('\n🔍 Checking Alerts Table...')
        const { data: alerts } = await supabase
            .from('alerts')
            .select('*')
            .eq('type', 'stagnant_stock')
            .order('created_at', { ascending: false })
            .limit(5)

        console.log('Recent Stagnant Stock Alerts:', alerts)

        // Check RLS Policies
        console.log('\n🔍 Checking RLS Policies...')

        console.log('Testing Anon Access...')
        const anonClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: anonAlerts, error: anonError } = await anonClient
            .from('alerts')
            .select('count', { count: 'exact', head: true })
            .limit(1)

        if (anonError) {
            console.error('❌ Anon Access Failed:', anonError)
        } else {
            console.log('✅ Anon Access Success. Count:', anonAlerts)
        }
    }
}

debugStagnant()
