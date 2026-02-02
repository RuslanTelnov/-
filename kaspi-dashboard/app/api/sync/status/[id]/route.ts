import { NextRequest, NextResponse } from 'next/server'
import { syncStatus } from '@/lib/sync/sync-status-store'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const syncId = params.id
    
    console.log('📊 Getting sync status for:', syncId)
    console.log('📊 Available syncs:', Array.from(syncStatus.keys()))
    
    const status = syncStatus.get(syncId)

    if (!status) {
      console.warn('⚠️ Sync not found:', syncId)
      return NextResponse.json(
        { 
          error: 'Sync not found',
          syncId,
          availableSyncs: Array.from(syncStatus.keys()),
          message: 'Синхронизация еще не началась или уже завершена'
        },
        { status: 404 }
      )
    }

    console.log('✅ Sync status found:', status.status, status.progress)
    return NextResponse.json(status)
  } catch (error: any) {
    console.error('❌ Error getting sync status:', error)
    return NextResponse.json(
      { 
        error: error?.message || 'Internal server error',
        details: error?.stack
      },
      { status: 500 }
    )
  }
}

