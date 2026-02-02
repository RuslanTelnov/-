'use client'

import { useState } from 'react'

interface Message {
    role: 'user' | 'assistant'
    content: string
    sources?: any[]
}

export default function RAGChat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [indexing, setIndexing] = useState(false)

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage: Message = {
            role: 'user',
            content: input,
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            const history = messages.map(m => ({
                question: m.role === 'user' ? m.content : '',
                answer: m.role === 'assistant' ? m.content : '',
            })).filter(h => h.question && h.answer)

            const response = await fetch('/api/rag/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: input,
                    history,
                }),
            })

            const data = await response.json()

            if (data.success) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.answer,
                    sources: data.sources,
                }
                setMessages(prev => [...prev, assistantMessage])
            } else {
                throw new Error(data.error || 'Failed to get response')
            }
        } catch (error: any) {
            const errorMessage: Message = {
                role: 'assistant',
                content: `Ошибка: ${error.message}`,
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }

    const handleIndex = async () => {
        setIndexing(true)
        try {
            const response = await fetch('/api/rag/index', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'all' }),
            })

            const data = await response.json()

            if (data.success) {
                alert('Индексация завершена успешно!')
            } else {
                throw new Error(data.error || 'Indexing failed')
            }
        } catch (error: any) {
            alert(`Ошибка индексации: ${error.message}`)
        } finally {
            setIndexing(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-2xl shadow-lg border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">RAG Помощник</h2>
                    <p className="text-sm text-gray-600">Задавайте вопросы о ваших данных</p>
                </div>
                <button
                    onClick={handleIndex}
                    disabled={indexing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {indexing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Индексация...
                        </>
                    ) : (
                        'Обновить индекс'
                    )}
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-20">
                        <p className="text-lg mb-4">Начните диалог с RAG помощником</p>
                        <p className="text-sm">Примеры вопросов:</p>
                        <ul className="text-sm mt-2 space-y-1">
                            <li>• Какие товары приносят больше всего прибыли?</li>
                            <li>• Какие товары нужно закупить в первую очередь?</li>
                            <li>• Покажи статистику продаж за последний период</li>
                        </ul>
                    </div>
                )}

                {messages.map((message, idx) => (
                    <div
                        key={idx}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg p-4 ${message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                        >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            {message.sources && message.sources.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-300">
                                    <p className="text-xs font-semibold mb-2">Источники:</p>
                                    <ul className="text-xs space-y-1">
                                        {message.sources.slice(0, 3).map((source, sidx) => (
                                            <li key={sidx}>
                                                • {source.sourceTable} (similarity: {(source.similarity * 100).toFixed(1)}%)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-gray-600">Думаю...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-gray-200">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Задайте вопрос..."
                        disabled={loading}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Отправить
                    </button>
                </div>
            </div>
        </div>
    )
}
