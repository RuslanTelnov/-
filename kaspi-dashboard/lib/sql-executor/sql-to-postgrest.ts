import { SupabaseClient } from '@supabase/supabase-js'

interface ParsedQuery {
    table: string
    columns: string
    limit?: number
    order?: string
    where?: Record<string, any>
}

export function parseSimpleSelect(query: string): ParsedQuery | null {
    try {
        // Very basic SQL parser for SELECT statements
        // Supported format: SELECT * FROM table [LIMIT n]

        const normalized = query.trim().replace(/\s+/g, ' ')
        const match = normalized.match(/^SELECT\s+(.+)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+LIMIT\s+(\d+))?/i)

        if (!match) return null

        const [, columns, table, limit] = match

        return {
            table,
            columns: columns.trim(),
            limit: limit ? parseInt(limit) : undefined
        }
    } catch (e) {
        return null
    }
}

export async function executeViaPostgREST(parsed: ParsedQuery, supabase: SupabaseClient) {
    try {
        let queryBuilder = supabase.from(parsed.table).select(parsed.columns === '*' ? undefined : parsed.columns)

        if (parsed.limit) {
            queryBuilder = queryBuilder.limit(parsed.limit)
        }

        const { data, error } = await queryBuilder

        if (error) {
            return { data: [], error }
        }

        return { data }
    } catch (error) {
        return { data: [], error }
    }
}
