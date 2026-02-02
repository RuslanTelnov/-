import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabaseAdmin
      .from('sales')
      .select('*')
      .order('moment', { ascending: false })
      .range(offset, offset + limit - 1)

    if (startDate) {
      query = query.gte('moment', startDate)
    }
    if (endDate) {
      query = query.lte('moment', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data, count: data?.length || 0 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

