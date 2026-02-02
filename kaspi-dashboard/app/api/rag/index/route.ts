import { NextRequest, NextResponse } from 'next/server'
import { getIndexer } from '@/lib/rag/indexer'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type = 'all' } = body

        const indexer = getIndexer()

        let results
        if (type === 'all') {
            results = await indexer.indexAll()
        } else if (type === 'products') {
            results = [await indexer.indexProducts()]
        } else if (type === 'metrics') {
            results = [await indexer.indexProductMetrics()]
        } else if (type === 'sales') {
            results = [await indexer.indexSales()]
        } else if (type === 'orders') {
            results = [await indexer.indexCustomerOrders()]
        } else {
            return NextResponse.json(
                { error: 'Invalid indexing type. Use: all, products, metrics, sales, or orders' },
                { status: 400 }
            )
        }

        const hasErrors = results.some(r => r.status === 'failed')

        return NextResponse.json({
            success: !hasErrors,
            results,
        })
    } catch (error: any) {
        console.error('Indexing error:', error)

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to index documents',
            },
            { status: 500 }
        )
    }
}
