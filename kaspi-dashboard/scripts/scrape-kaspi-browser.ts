
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

puppeteer.use(StealthPlugin())

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const KASPI_SEARCH_URL = 'https://kaspi.kz/shop/search/?text='

async function scrapePrices() {
    console.log('🚀 Starting Kaspi Browser Scraper...')

    // 1. Get products without price
    const { data: products } = await supabase
        .from('products')
        .select('id, name, article, code')
        .or('kaspi_price.is.null,kaspi_price.eq.0')
    // .limit(5) // Limit removed for full run

    if (!products || products.length === 0) {
        console.log('✅ No products missing prices!')
        return
    }

    console.log(`📦 Found ${products.length} products to scrape.`)

    const browser = await puppeteer.launch({
        headless: true, // Try headless first
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Set viewport and user agent
    await page.setViewport({ width: 1366, height: 768 })
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    let updated = 0
    let consecutiveErrors = 0

    for (const [index, product] of products.entries()) {
        if (consecutiveErrors >= 5) {
            console.error('❌ Too many consecutive errors (blocked?). Aborting.')
            break
        }

        const query = product.article || product.name
        if (!query) continue

        console.log(`\n[${index + 1}/${products.length}] 🔍 Searching for: ${query}`)

        try {
            await page.goto(`${KASPI_SEARCH_URL}${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' })

            // Wait for results
            try {
                await page.waitForSelector('.item-card__prices-price', { timeout: 5000 })
            } catch (e) {
                console.log('   ⚠️ No price element found (timeout)')
                // Not a critical error, just not found
                await new Promise(r => setTimeout(r, 2000))
                continue
            }

            // Extract price
            const priceText = await page.$eval('.item-card__prices-price', el => el.textContent)

            if (priceText) {
                const price = parseFloat(priceText.replace(/\D/g, ''))
                console.log(`   💰 Found Price: ${price}`)

                if (price > 0) {
                    // Update DB
                    await supabase
                        .from('products')
                        .update({ kaspi_price: price })
                        .eq('id', product.id)

                    // Add to history
                    await supabase
                        .from('kaspi_price_history')
                        .insert({
                            product_id: product.id,
                            price: price,
                            source: 'browser_scrape'
                        })

                    updated++
                    consecutiveErrors = 0 // Reset error count
                }
            } else {
                console.log('   ⚠️ Price text empty')
            }

            // Random delay to be polite (3-7 seconds)
            const delay = 3000 + Math.random() * 4000
            // console.log(`   ⏳ Waiting ${Math.round(delay)}ms...`)
            await new Promise(r => setTimeout(r, delay))

        } catch (e: any) {
            console.error(`   ❌ Error: ${e.message}`)
            consecutiveErrors++
        }
    }

    await browser.close()
    console.log(`\n🏁 Scrape Complete. Updated ${updated} products.`)
}

scrapePrices()
