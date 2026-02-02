import axios, { AxiosInstance } from 'axios'

export class KaspiClient {
    private client: AxiosInstance

    constructor(token: string) {
        this.client = axios.create({
            baseURL: 'https://kaspi.kz/shop/api/v2',
            headers: {
                'X-Auth-Token': token,
                'Content-Type': 'application/vnd.api+json',
                'Accept': 'application/vnd.api+json',
            },
        })
    }

    async getOrders(days = 7) {
        const now = new Date()
        const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

        const response = await this.client.get('/orders', {
            params: {
                'page[number]': 0,
                'page[size]': 20,
                'filter[orders][state]': 'ARCHIVE', // Or others
                'filter[orders][creationDate][$ge]': past.getTime()
            }
        })
        return response.data
    }

    // Placeholder for price fetching - we need to find the correct endpoint
    // Trying a few known variations
    async getProductPrices() {
        // TODO: Find correct endpoint. 
        // For now, we might need to rely on the user providing an XML link or use a different method.
        // But let's try to return empty or mock if we can't find it.

        // If we can't fetch prices via API, we might need to scrape or use XML.
        // But let's try one more: /xml/offers
        try {
            const response = await this.client.get('/xml/offers')
            return response.data // This would be XML
        } catch (e) {
            console.warn('Failed to fetch XML offers via API')
            return null
        }
    }
}
