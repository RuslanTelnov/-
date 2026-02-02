import { supabaseAdmin } from '../supabase/server'
import { sendTelegramMessage } from '../notifications/telegram'

export async function checkMissingCostsAndNotify() {
    console.log('🔍 Checking for products with missing cost price...')

    try {
        // 1. Find products with cost_price = 0 and not archived
        const { data: products, error } = await supabaseAdmin
            .from('products')
            .select('article, name')
            .eq('cost_price', 0)
            .eq('archived', false) as { data: any[], error: any }

        if (error) {
            console.error('❌ Error fetching missing cost products:', error)
            return
        }

        const count = products?.length || 0

        if (count === 0) {
            console.log('✅ No products with missing cost price found.')
            return
        }

        // 2. Format the message
        let message = `⚠️ *Внимание! Отсутствует себестоимость*\n\n`
        message += `У *${count}* товаров не указана себестоимость (0 ₸).\n`
        message += `Это приводит к ошибкам в расчете маржи.\n\n`
        message += `*Примеры товаров:*\n`

        // List first 10 products
        const previewList = products.slice(0, 10)
        previewList.forEach(p => {
            message += `- \`${p.article}\` ${p.name}\n`
        })

        if (count > 10) {
            message += `\n...и еще ${count - 10} товаров.`
        }

        message += `\n\n👉 Пожалуйста, укажите закупочные цены в МойСклад.`

        // 3. Send notification
        const sent = await sendTelegramMessage(message)

        if (sent) {
            console.log(`✅ Telegram notification sent for ${count} missing cost products.`)
        }

    } catch (error) {
        console.error('❌ Error in checkMissingCostsAndNotify:', error)
    }
}
