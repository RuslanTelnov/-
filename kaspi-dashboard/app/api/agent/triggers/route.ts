import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { TriggerAgent } from '@/lib/agent/trigger-agent'

export const dynamic = 'force-dynamic'

// GET: List triggers
export async function GET() {
    const { data, error } = await (supabaseAdmin as any)
        .from('agent_triggers')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ triggers: data })
}

// POST: Create new trigger or generate them
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (body.action === 'generate') {
            const agent = new TriggerAgent()
            const result = await agent.generateNewTriggers()
            return NextResponse.json({ message: result })
        }

        if (body.action === 'toggle') {
            const { id, is_active } = body
            const { error } = await (supabaseAdmin as any)
                .from('agent_triggers')
                .update({ is_active })
                .eq('id', id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        // Create manual trigger
        const { name, description, condition_prompt, action_prompt } = body
        const { data, error } = await (supabaseAdmin as any)
            .from('agent_triggers')
            .insert({ name, description, condition_prompt, action_prompt })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ trigger: data })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
