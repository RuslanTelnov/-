'use client'
import { useState, useRef, useEffect } from 'react'

export default function AgentChat() {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'Привет! Я AI-аналитик. Я могу помочь вам проанализировать данные вашего бизнеса. Спросите меня о продажах, остатках или прибыли.' }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMessage = input
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setLoading(true)

        try {
            const res = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
            })

            const data = await res.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Извините, произошла ошибка при обработке запроса.' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-[600px] flex flex-col">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                <span className="text-3xl">🤖</span> AI Аналитик
            </h2>

            <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                            }`}>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {m.content}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-none shadow-sm">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Например: 'Какая выручка за прошлый месяц?'"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    )
}
