
import axios from 'axios'
import { XMLParser } from 'fast-xml-parser'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function run() {
    const feedUrl = 'https://mskaspi.fixhub.kz/xml/35fde8f355cd299f7a3e26cbe0e4f917.xml'

    console.log(`📥 Fetching XML feed from: ${feedUrl}`)
    try {
        const response = await axios.get(feedUrl, {
            responseType: 'text',
            timeout: 30000
        })

        const xmlData = response.data
        console.log(`✅ XML downloaded (${xmlData.length} bytes)`)

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_'
        })
        const jsonObj = parser.parse(xmlData)

        let offers: any[] = []
        if (jsonObj.kaspi_catalog?.offers?.offer) {
            offers = jsonObj.kaspi_catalog.offers.offer
        } else if (jsonObj.yml_catalog?.shop?.offers?.offer) {
            offers = jsonObj.yml_catalog.shop.offers.offer
        }

        if (!Array.isArray(offers)) offers = [offers]

        console.log(`📦 Total offers in feed: ${offers.length}`)

        // Search for the item
        const targetSku = '109226388'
        const targetNamePart = 'D11'

        const foundBySku = offers.filter((o: any) => {
            const sku = o['@_sku'] || o['sku'] || o['@_id'] || o['id']
            return String(sku).includes(targetSku)
        })

        const foundByName = offers.filter((o: any) => {
            const name = o.model || o.name || o.description || ''
            return String(name).toLowerCase().includes(targetNamePart.toLowerCase())
        })

        console.log(`\n🔍 Found by SKU "${targetSku}": ${foundBySku.length}`)

        console.log('\n📦 Sample Items from Feed:')
        offers.slice(0, 5).forEach((o: any) => console.log(JSON.stringify(o, null, 2)))

    } catch (error: any) {
        console.error('❌ Error:', error.message)
    }
}

run()
