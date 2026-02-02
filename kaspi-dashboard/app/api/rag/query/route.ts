import { NextRequest, NextResponse } from 'next/server'
import { getRAGChain } from '@/lib/rag/rag-chain'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { question, history } = body

        if (!question || typeof question !== 'string') {
            return NextResponse.json(
                { error: 'Question is required and must be a string' },
                { status: 400 }
            )
        }

        const ragChain = getRAGChain()

        let response
        if (history && Array.isArray(history)) {
            response = await ragChain.queryWithHistory(question, history)
        } else {
            response = await ragChain.query(question)
        }

        return NextResponse.json({
            success: true,
            ...response,
        })
    } catch (error: any) {
        console.error('RAG query error:', error)

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to process RAG query',
            },
            { status: 500 }
        )
    }
}
