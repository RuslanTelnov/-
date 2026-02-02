import { NextRequest, NextResponse } from 'next/server'
import { getVectorStore } from '@/lib/rag/vector-store'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const vectorStore = getVectorStore()

        // Получаем статистику векторного хранилища
        const stats = await vectorStore.getStats()

        // Получаем статус индексации
        const { data: indexingStatus } = await (supabaseAdmin as any)
            .from('indexing_status')
            .select('*')
            .order('updated_at', { ascending: false })

        return NextResponse.json({
            success: true,
            stats,
            indexingStatus: indexingStatus || [],
        })
    } catch (error: any) {
        console.error('Status error:', error)

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to get RAG status',
            },
            { status: 500 }
        )
    }
}
