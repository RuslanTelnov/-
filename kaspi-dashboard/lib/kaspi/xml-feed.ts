import axios from 'axios'
import { XMLParser } from 'fast-xml-parser'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Client (Admin)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function syncKaspiXmlFeed(feedUrl: string) {
    console.log(`📥 Fetching XML feed from: ${feedUrl}`)

    try {
        // 1. Download XML
        const response = await axios.get(feedUrl, {
            responseType: 'text',
            timeout: 30000 // 30s timeout
        })

        const xmlData = response.data
        console.log(`✅ XML downloaded (${xmlData.length} bytes)`)

        // 2. Parse XML
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_'
        })
        const jsonObj = parser.parse(xmlData)

        // Kaspi XML usually has structure: <kaspi_catalog><offers><offer ...>...</offer></offers></kaspi_catalog>
        // Or standard YML/XML format

        let offers: any[] = []

        if (jsonObj.kaspi_catalog?.offers?.offer) {
            offers = jsonObj.kaspi_catalog.offers.offer
        } else if (jsonObj.yml_catalog?.shop?.offers?.offer) {
            offers = jsonObj.yml_catalog.shop.offers.offer
        } else {
            console.warn('Unknown XML structure. Dumping keys:', Object.keys(jsonObj))
            throw new Error('Unknown XML structure')
        }

        if (!Array.isArray(offers)) {
            offers = [offers] // Handle single item case
        }

        console.log(`📦 Found ${offers.length} offers in XML`)

        // 3. Prepare updates
        const updates: { article: string; price: number; name?: string }[] = []

        offers.forEach((offer: any) => {
            // Debug: log keys for first offer
            if (updates.length === 0 && offers.indexOf(offer) === 0) {
                console.log('First offer keys:', Object.keys(offer))
            }

            // Structure confirmed: <offer sku="..."> <price>...</price> </offer>
            // fast-xml-parser prefixes attributes with @_, so sku becomes @_sku
            let rawSku = offer['@_sku'] || offer['sku'] || offer['@_id'] || offer['id']

            // Ensure SKU is treated as string and trimmed
            const sku = rawSku ? String(rawSku).trim() : null
            const price = parseFloat(offer.price || 0)
            const name = offer.model || offer.name || offer.description // Capture name for fuzzy search

            if (sku && price > 0) {
                updates.push({ article: sku, price, name })
            }
        })

        if (updates.length > 0) {
            console.log(`Sample update: SKU="${updates[0].article}" Price=${updates[0].price}`)
        } else {
            console.warn('⚠️ No updates prepared! Check XML structure.')
            if (offers.length > 0) console.log('First offer keys:', Object.keys(offers[0]))
        }

        console.log(`📝 Prepared ${updates.length} price updates`)

        // 4. Batch update Supabase
        // Optimization: Fetch all products first to map Code -> ID (and Article -> ID as fallback)
        const { data: products } = await supabase
            .from('products')
            .select('id, article, code, name, moysklad_id') // Added moysklad_id

        console.log(`📦 Found ${products?.length || 0} products in DB`)

        // Create maps for fast lookup
        const codeMap = new Map(products?.map(p => [p.code, p]))
        const articleMap = new Map(products?.map(p => [p.article, p]))

        // Prepare product list for fuzzy search (exclude items already in maps if needed, but keeping all is safer)
        const productList = products || []

        // Log sample matching
        if (updates.length > 0) {
            console.log(`Sample update: SKU="${updates[0].article}" Price=${updates[0].price}`)
        }

        let updatedCount = 0
        const batchSize = 100

        // Stats
        let matchedByCode = 0
        let matchedByArticle = 0
        let matchedByFuzzy = 0
        let notMatched = 0

        // Import Levenshtein helper dynamically to avoid top-level import issues if not used elsewhere
        const { calculateSimilarity } = await import('../utils/levenshtein')

        for (let i = 0; i < updates.length; i += batchSize) {
            const chunk = updates.slice(i, i + batchSize)

            const upsertData = chunk
                .map(u => {
                    let product = null
                    let matchType = ''

                    // 1. Try Exact Match by Code (Kaspi SKU)
                    if (codeMap.has(u.article)) {
                        product = codeMap.get(u.article)
                        matchType = 'code'
                        matchedByCode++
                    }
                    // 2. Try Exact Match by Article
                    else if (articleMap.has(u.article)) {
                        product = articleMap.get(u.article)
                        matchType = 'article'
                        matchedByArticle++
                    }
                    // 3. Try Fuzzy Match by Name
                    else if (u.name) { // Only if XML provided a name (model)
                        // Find best match
                        let bestMatch = null
                        let bestScore = 0
                        const THRESHOLD = 80 // 80% similarity

                        for (const p of productList) {
                            const score = calculateSimilarity(u.name, p.name)
                            if (score > bestScore) {
                                bestScore = score
                                bestMatch = p
                            }
                        }

                        if (bestScore >= THRESHOLD && bestMatch) {
                            product = bestMatch
                            matchType = 'fuzzy'
                            matchedByFuzzy++
                            // console.log(`🧩 Fuzzy Match: "${u.name}" ~= "${bestMatch.name}" (${bestScore.toFixed(1)}%)`)
                        }
                    }

                    if (!product) {
                        notMatched++
                        return null
                    }

                    return {
                        id: product.id,
                        moysklad_id: product.moysklad_id,
                        article: product.article, // Include to satisfy constraint
                        code: product.code,       // Include to satisfy constraint
                        name: product.name,       // Include to satisfy constraint
                        kaspi_price: u.price,
                        updated_at: new Date().toISOString()
                    }
                })
                .filter(Boolean) as any[]

            if (upsertData.length > 0) {
                const { error } = await supabase
                    .from('products')
                    .upsert(upsertData, { onConflict: 'id' })

                if (error) {
                    console.error('Error updating chunk: ' + error.message)
                } else {
                    updatedCount += upsertData.length

                    // Log to history
                    const historyData = upsertData.map(u => ({
                        product_id: u.id,
                        price: u.kaspi_price,
                        source: 'xml',
                        created_at: new Date().toISOString()
                    }))

                    const { error: histError } = await supabase
                        .from('kaspi_price_history')
                        .insert(historyData)

                    if (histError) console.error('Error logging history:', histError.message)
                }
            }
        }

        console.log(`✅ Sync Complete. Updated: ${updatedCount}`)
        console.log(`📊 Stats: Code=${matchedByCode}, Article=${matchedByArticle}, Fuzzy=${matchedByFuzzy}, Missed=${notMatched}`)

        return { success: true, count: updatedCount }

    } catch (error: any) {
        console.error('❌ XML Sync Error:', error.message)
        return { success: false, error: error.message }
    }
}
