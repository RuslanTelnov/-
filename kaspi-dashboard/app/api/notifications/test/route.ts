import { NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/notifications/telegram'
import { checkMissingCostsAndNotify } from '@/lib/alerts/check-missing-costs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { type } = body

        if (type === 'test') {
            const sent = await sendTelegramMessage('🔔 *Тестовое уведомление*\nСистема уведомлений работает корректно.')
            return NextResponse.json({ success: sent, message: sent ? 'Message sent' : 'Failed to send' })
        }

        if (type === 'check_costs') {
            await checkMissingCostsAndNotify()
            return NextResponse.json({ success: true, message: 'Check initiated' })
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
