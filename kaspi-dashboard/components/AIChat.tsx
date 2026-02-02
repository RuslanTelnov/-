'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sqlResult?: boolean
  sqlError?: boolean
  sqlData?: any[]
  rowCount?: number
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Привет! Я AI помощник для анализа данных вашего склада.\n\nЯ могу:\n- Отвечать на вопросы о данных\n- Выполнять SQL запросы для получения конкретных данных\n\nПримеры SQL запросов:\n- `SELECT * FROM products LIMIT 10;`\n- `SELECT article, name, price FROM products WHERE price > 1000;`\n- `SELECT DATE(moment) as date, SUM(sum) as revenue FROM sales GROUP BY DATE(moment);`\n\nЗадайте вопрос или напишите SQL запрос!',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setLoading(true)

    try {
      // Получаем историю сообщений для контекста
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          context: { includeData: false }, // Не загружаем данные автоматически для SQL запросов
          history,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при получении ответа')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        sqlResult: data.sqlResult || false,
        sqlError: data.sqlError || false,
        sqlData: data.data,
        rowCount: data.rowCount,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Извините, произошла ошибка: ${error.message}`,
        sqlError: true,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatSQLData = (data: any[]): string => {
    if (!data || data.length === 0) return 'Нет данных'

    // Если данные в формате JSONB (из функции execute_readonly_query)
    const rows = data.map((row: any) => {
      if (row.result && typeof row.result === 'object') {
        return row.result
      }
      return row
    })

    if (rows.length === 0) return 'Нет данных'

    const keys = Object.keys(rows[0])
    let table = keys.join(' | ') + '\n'
    table += '-'.repeat(table.length) + '\n'
    
    rows.slice(0, 100).forEach((row: any) => {
      const values = keys.map(key => {
        const value = row[key]
        if (value === null || value === undefined) return 'NULL'
        if (typeof value === 'object') return JSON.stringify(value).substring(0, 50)
        return String(value).substring(0, 50)
      })
      table += values.join(' | ') + '\n'
    })

    if (rows.length > 100) {
      table += `\n... и еще ${rows.length - 100} строк`
    }

    return table
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 flex flex-col h-[700px]">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-2xl font-bold text-gray-900">AI Помощник</h2>
        <p className="text-sm text-gray-600 mt-1">
          Задавайте вопросы или выполняйте SQL запросы для анализа данных
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-5 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg'
                  : message.sqlError
                  ? 'bg-red-50 border border-red-200 text-red-900'
                  : message.sqlResult
                  ? 'bg-green-50 border border-green-200 text-gray-900'
                  : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
              }`}
            >
              {message.sqlResult && message.sqlData ? (
                <div className="space-y-3">
                  <p className="whitespace-pre-wrap font-medium text-sm mb-3">
                    {message.content}
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 overflow-x-auto">
                    <div className="text-xs font-mono whitespace-pre text-gray-800">
                      {formatSQLData(message.sqlData)}
                    </div>
                    {message.rowCount !== undefined && (
                      <div className="mt-2 text-xs text-gray-500">
                        Всего строк: {message.rowCount}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-sm text-gray-600 ml-2">Обрабатываю запрос...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Задайте вопрос или напишите SQL запрос (SELECT...)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg transition-all transform hover:scale-105 disabled:transform-none"
          >
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 ml-1">
          💡 Подсказка: SQL запросы должны начинаться с SELECT, WITH, EXPLAIN, SHOW или DESCRIBE
        </p>
      </div>
    </div>
  )
}
