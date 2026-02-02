import { NextRequest, NextResponse } from 'next/server'
import { TriggerAgent } from '@/lib/agent/trigger-agent'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const agent = new TriggerAgent()

        // Run asynchronously to not block the response
        // In a real serverless env (Vercel), this might be killed. 
        // Ideally use a queue or ensure it runs fast.
        // For this demo, we'll await it to show results immediately or just kick it off.
        // Let's await it so the user sees the result in the UI immediately.
        await agent.evaluateTriggers()

        return NextResponse.json({
            success: true,
            message: 'Agent execution completed'
        })
    } catch (error: any) {
        console.error('Agent run error:', error)
        return NextResponse.json(
            { error: error.message || 'Agent run failed' },
            { status: 500 }
        )
    }
}
