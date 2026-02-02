import axios from 'axios'

const token = 'dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0='

async function testKaspiToken() {
    console.log('Testing Kaspi API Token...')

    try {
        // Попробуем получить список точек продаж или архивные заказы (что-то легкое)
        // Но самый верный способ - получить список товаров (offers)
        // Endpoint: https://kaspi.kz/shop/api/v2/master/product/offer
        // Требует параметры, но попробуем без них или с минимальными

        // Вариант 1: JSON API offers
        console.log('Trying /offers with JSON API header...')
        try {
            const response = await axios.get('https://kaspi.kz/shop/api/v2/offers', {
                headers: {
                    'X-Auth-Token': token,
                    'Content-Type': 'application/vnd.api+json',
                    'Accept': 'application/vnd.api+json'
                },
                params: {
                    'page[number]': 0,
                    'page[size]': 5,
                    'filter[offers][state]': 'ACTIVE' // Some APIs use this format
                }
            })
            console.log('✅ /offers Success!', response.status)
            return
        } catch (e: any) {
            console.log('❌ /offers Failed:', e.response?.status)
        }

        // Вариант 2: Old endpoint or XML
        console.log('Trying /city...')
        try {
            const response = await axios.get('https://kaspi.kz/shop/api/v2/city', {
                headers: {
                    'X-Auth-Token': token,
                    'Content-Type': 'application/json'
                }
            })
            console.log('✅ /city Success!', response.status)
            return
        } catch (e: any) {
            console.log('❌ /city Failed:', e.response?.status)
        }

        // Вариант 3: master/product/offer with JSON API header
        console.log('Trying /master/product/offer with JSON API header...')
        try {
            const response = await axios.get('https://kaspi.kz/shop/api/v2/master/product/offer', {
                headers: {
                    'X-Auth-Token': token,
                    'Content-Type': 'application/vnd.api+json',
                    'Accept': 'application/vnd.api+json'
                },
                params: {
                    'filter[offerStatus]': 'ACTIVE',
                    'page[number]': 0,
                    'page[size]': 5
                }
            })
            console.log('✅ /master/product/offer Success!', response.status)
            if (response.data?.data?.length > 0) {
                console.log('Sample:', response.data.data[0].attributes)
            }
            return
            // Вариант 4: /is/product/offer/active
        } catch (e: any) {
            console.log('❌ /master/product/offer Failed:', e.response?.status)
        }
        console.log('Trying /is/product/offer/active...')
        try {
            const response = await axios.get('https://kaspi.kz/shop/api/v2/is/product/offer/active', {
                headers: {
                    'X-Auth-Token': token,
                    'Content-Type': 'application/vnd.api+json',
                    'Accept': 'application/vnd.api+json'
                }
            })
            console.log('✅ /is/product/offer/active Success!', response.status)
            return
        } catch (e: any) {
            console.log('❌ /is/product/offer/active Failed:', e.response?.status)
        }

        // Вариант 5: Orders endpoint with valid filters
        console.log('Trying /orders with filters...')
        const now = new Date()
        const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

        try {
            const response = await axios.get('https://kaspi.kz/shop/api/v2/orders', {
                headers: {
                    'X-Auth-Token': token,
                    'Content-Type': 'application/vnd.api+json',
                    'Accept': 'application/vnd.api+json'
                },
                params: {
                    'page[number]': 0,
                    'page[size]': 1,
                    'filter[orders][state]': 'ARCHIVE', // Try ARCHIVE or NEW
                    'filter[orders][creationDate][$ge]': past.getTime(),
                    'include': 'entries' // Request entries
                }
            })
            console.log('✅ /orders Success!', response.status)
            const orders = response.data?.data || []
            console.log('Orders found:', orders.length)

            if (orders.length > 0) {
                const order = orders[0]
                console.log('Sample Order Attributes:', JSON.stringify(order.attributes, null, 2))

                // Check entries (included)
                if (response.data.included) {
                    console.log('Included Data (Entries):', JSON.stringify(response.data.included[0], null, 2))
                }
            }
            return
        } catch (e: any) {
            console.log('❌ /orders Failed:', e.response?.status, JSON.stringify(e.response?.data))
        }

        console.error('❌ Token verification FAILED: All attempts failed.')

    } catch (error: any) {
        console.error('❌ Token verification FAILED')
        if (error.response) {
            console.error('Status:', error.response.status)
            console.error('Data:', error.response.data)
        } else {
            console.error('Error:', error.message)
        }
    }
}

testKaspiToken()
