import { NextResponse } from 'next/server'
import { syncKaspiXmlFeed } from '@/lib/kaspi/xml-feed'

// This URL should ideally be in env vars, but for now we use the one provided by user
const KASPI_XML_FEED_URL = 'https://mskaspi.fixhub.kz/xml/35fde8f355cd299f7a3e26cbe0e4f917.xml'

export async function POST() {
    try {
        process.stdout.write('🔄 Starting Kaspi XML Sync (API Route)...\n')

        const result = await syncKaspiXmlFeed(KASPI_XML_FEED_URL)

        if (result.success) {
            return NextResponse.json({ success: true, message: `Updated ${result.count} prices` })
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 })
        }
    } catch (error: any) {
        console.error('Sync API Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
