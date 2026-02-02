'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function ConveyorPage() {
    const [isRunning, setIsRunning] = useState(false)
    const [logs, setLogs] = useState("")
    const [chatInput, setChatInput] = useState("")
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: 'Привет! Я твой AI-ассистент конвейера. Нажми "Start", чтобы запустить процесс интеграции WB -> MS -> Kaspi.' }
    ])
    const [loadingChat, setLoadingChat] = useState(false)
    const logEndRef = useRef(null)

    // Poll logs
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/conveyor/status')
                const data = await res.json()
                if (data.logs) setLogs(data.logs)
            } catch (e) {
                console.error("Log fetch error", e)
            }
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    // Scroll to bottom of logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const toggleConveyor = async () => {
        if (isRunning) {
            // Stop
            await fetch('/api/conveyor/run', { method: 'DELETE' })
            setIsRunning(false)
            addChatMessage('system', 'Конвейер останавливается...')
        } else {
            // Start
            await fetch('/api/conveyor/run', { method: 'POST' })
            setIsRunning(true)
            addChatMessage('system', 'Конвейер запущен! Начинаю парсинг и обработку.')
        }
    }

    const addChatMessage = (role, content) => {
        setChatHistory(prev => [...prev, { role, content }])
    }

    const handleChatSubmit = async (e) => {
        e.preventDefault()
        if (!chatInput.trim()) return

        const userMsg = chatInput
        setChatInput("")
        addChatMessage('user', userMsg)
        setLoadingChat(true)

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg })
            })
            const data = await res.json()
            addChatMessage('assistant', data.reply || "Error getting response.")
        } catch (e) {
            addChatMessage('assistant', "К сожалению, произошла ошибка связи с AI.")
        } finally {
            setLoadingChat(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)', color: 'var(--velveto-text-primary)' }}>

            {/* Nav */}
            <nav style={{ padding: '2rem 3rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link href="/" style={{ color: 'var(--velveto-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>
                    ← Back to Dashboard
                </Link>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isRunning ? '#10B981' : '#EF4444', boxShadow: isRunning ? '0 0 10px #10B981' : 'none' }} />
                    <span style={{ fontSize: '0.9rem', color: isRunning ? '#10B981' : '#EF4444' }}>
                        {isRunning ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                    </span>
                </div>
            </nav>

            <main className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 3rem' }}>

                <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '200', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                        WB <span style={{ color: 'var(--velveto-text-secondary)' }}>↔</span> MS <span style={{ color: 'var(--velveto-text-secondary)' }}>↔</span> Kaspi
                    </h1>
                    <p style={{ color: 'var(--velveto-text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                        Автоматический конвейер: Парсинг → Создание Номенклатур (Предзаказ 30 дней) → Оприходование (10 шт) → Публикация на Kaspi.
                    </p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 400px', gap: '2rem' }}>

                    {/* Left Column: Controls & Logs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Control Panel */}
                        <div className="velveto-card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', background: 'rgba(5, 8, 20, 0.6)' }}>
                            <motion.button
                                onClick={toggleConveyor}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: isRunning ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                                    color: 'white',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    cursor: 'pointer',
                                    marginBottom: '1.5rem',
                                    boxShadow: isRunning ? '0 0 30px rgba(16, 185, 129, 0.4)' : '0 0 30px rgba(239, 68, 68, 0.4)'
                                }}
                            >
                                {isRunning ? 'STOP' : 'START'}
                            </motion.button>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{isRunning ? 'Conveyor Active' : 'Conveyor Idle'}</h3>
                                <p style={{ color: 'var(--velveto-text-muted)', fontSize: '0.9rem' }}>
                                    {isRunning ? 'Система автоматически обрабатывает товары.' : 'Нажмите Start для запуска цикла.'}
                                </p>
                            </div>
                        </div>

                        {/* Logs Terminal */}
                        <div className="velveto-card" style={{
                            flexGrow: 1,
                            background: '#0a0a0a',
                            border: '1px solid #333',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            color: '#00ff00',
                            height: '400px',
                            overflowY: 'auto',
                            whiteSpace: 'pre-wrap'
                        }}>
                            <div style={{ marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem', color: '#666' }}>/// SYSTEM LOGS</div>
                            {logs || "Waiting for logs..."}
                            <div ref={logEndRef} />
                        </div>
                    </div>

                    {/* Right Column: AI Agent */}
                    <div className="velveto-card" style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '600px',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>AI Assistant</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--velveto-text-muted)' }}>Help & Instructions</div>
                        </div>

                        <div style={{ flexGrow: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {chatHistory.map((msg, i) => (
                                <div key={i} style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    background: msg.role === 'user' ? 'var(--velveto-accent-primary)' : 'rgba(255,255,255,0.05)',
                                    color: msg.role === 'user' ? '#000' : 'var(--velveto-text-primary)',
                                    padding: '0.8rem 1.2rem',
                                    borderRadius: '12px',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.5'
                                }}>
                                    {msg.content}
                                </div>
                            ))}
                            {loadingChat && <div style={{ alignSelf: 'flex-start', color: '#666', fontSize: '0.8rem' }}>AI печатает...</div>}
                        </div>

                        <form onSubmit={handleChatSubmit} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <input
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="Спросите что-нибудь..."
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />
                        </form>
                    </div>

                </div>
            </main>
        </div>
    )
}
