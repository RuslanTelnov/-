import React, { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export function KaspiPriceSync({ onSyncComplete }: { onSyncComplete: () => void }) {
    const [syncing, setSyncing] = useState(false)
    const [message, setMessage] = useState('')

    const handleSync = async () => {
        setSyncing(true)
        setMessage('Синхронизация...')

        try {
            const response = await fetch('/api/sync/kaspi-xml', { method: 'POST' })
            const data = await response.json()

            if (data.success) {
                setMessage(`✅ ${data.message}`)
                setTimeout(() => {
                    setMessage('')
                    onSyncComplete()
                }, 3000)
            } else {
                throw new Error(data.error || 'Unknown error')
            }

        } catch (error: any) {
            console.error('Sync error:', error)
            setMessage(`❌ Ошибка: ${error.message}`)
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleSync}
                disabled={syncing}
                className="neon-button px-4 py-2 rounded-full text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {syncing ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Обновление...</span>
                    </>
                ) : (
                    <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Обновить цены</span>
                    </>
                )}
            </button>
            {message && (
                <span className="text-xs text-fintech-aqua animate-pulse font-mono">
                    {message}
                </span>
            )}
        </div>
    )
}
