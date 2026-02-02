
import dotenv from 'dotenv'
import path from 'path'
import fetch from 'node-fetch'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const MOY_SKLAD_TOKEN = process.env.MOY_SKLAD_TOKEN

if (!MOY_SKLAD_TOKEN) {
    console.error('Missing MOY_SKLAD_TOKEN')
    process.exit(1)
}

async function inspectStockRaw() {
    console.log('Fetching raw stock data from MoySklad...')

    const url = 'https://api.moysklad.ru/api/remap/1.2/report/stock/all?limit=5'

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${MOY_SKLAD_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip'
            }
        })

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`)
            return
        }

        const data = await response.json()

        if (data.rows && data.rows.length > 0) {
            console.log('Successfully fetched rows.')
            console.log('Inspecting first row keys:')
            const firstRow = data.rows[0]
            console.log(Object.keys(firstRow))

            console.log('\nChecking for stockByStore:')
            if (firstRow.stockByStore) {
                console.log('stockByStore found!')
                console.log(JSON.stringify(firstRow.stockByStore, null, 2))
            } else {
                console.log('stockByStore NOT found in first row.')
            }

            console.log('\nSample Row Data (First Item):')
            console.log(JSON.stringify(firstRow, null, 2))

            // Check specifically for price-like fields
            console.log('\nChecking for price/cost fields in first 5 items:')
            data.rows.forEach((row: any, i: number) => {
                console.log(`\nItem ${i + 1} (${row.name}):`)
                console.log(`- stock: ${row.stock}`)
                console.log(`- price: ${row.price}`)
                console.log(`- cost: ${row.cost}`)
                console.log(`- buyPrice: ${row.buyPrice}`)
                console.log(`- salePrice: ${row.salePrice}`)
                console.log(`- stockPrice: ${row.stockPrice}`)
                console.log(`- avgCost: ${row.avgCost}`)
            })
        } else {
            console.log('No rows returned.')
        }
    } catch (error) {
        console.error('Fetch error:', error)
    }
}

inspectStockRaw()
