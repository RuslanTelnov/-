/**
 * Utility to send messages via Telegram Bot API
 */
export async function sendTelegramMessage(message: string): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!token || !chatId) {
        console.warn('⚠️ Telegram credentials not found. Skipping notification.')
        return false
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown', // Allows bold, italic, etc.
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('❌ Failed to send Telegram message:', errorData)
            return false
        }

        return true
    } catch (error) {
        console.error('❌ Error sending Telegram message:', error)
        return false
    }
}
