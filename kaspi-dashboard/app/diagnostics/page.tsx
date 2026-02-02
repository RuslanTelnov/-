'use client'

import { useState } from 'react'

export default function DiagnosticsPage() {
  const [results, setResults] = useState<Record<string, any>>({})
  const [testing, setTesting] = useState(false)

  const tests = [
    {
      name: 'Проверка подключения к Мой склад',
      endpoint: '/api/test-moy-sklad',
      method: 'GET',
    },
    {
      name: 'Проверка Supabase',
      endpoint: '/api/verify',
      method: 'GET',
    },
    {
      name: 'Синхронизация товаров (тест)',
      endpoint: '/api/sync',
      method: 'POST',
      body: { type: 'products' },
    },
  ]

  const runTest = async (test: typeof tests[0]) => {
    try {
      const options: RequestInit = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (test.body) {
        options.body = JSON.stringify(test.body)
      }

      const response = await fetch(test.endpoint, options)
      const data = await response.json().catch(() => ({ error: 'Не удалось прочитать JSON' }))

      setResults(prev => ({
        ...prev,
        [test.name]: {
          status: response.status,
          ok: response.ok,
          data,
          timestamp: new Date().toLocaleTimeString(),
        },
      }))
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [test.name]: {
          error: error.message,
          timestamp: new Date().toLocaleTimeString(),
        },
      }))
    }
  }

  const runAllTests = async () => {
    setTesting(true)
    setResults({})

    for (const test of tests) {
      await runTest(test)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Пауза между тестами
    }

    setTesting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-6">Диагностика системы</h1>

          <div className="mb-6">
            <button
              onClick={runAllTests}
              disabled={testing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {testing ? 'Выполняю тесты...' : 'Запустить все тесты'}
            </button>
          </div>

          <div className="space-y-4">
            {tests.map(test => (
              <div key={test.name} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{test.name}</h3>
                  <button
                    onClick={() => runTest(test)}
                    disabled={testing}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
                  >
                    Запустить
                  </button>
                </div>

                {results[test.name] && (
                  <div className={`mt-2 p-3 rounded ${
                    results[test.name].ok 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="text-sm">
                      <p><strong>Статус:</strong> {results[test.name].status || 'N/A'}</p>
                      <p><strong>Время:</strong> {results[test.name].timestamp}</p>
                      {results[test.name].error && (
                        <p className="text-red-600"><strong>Ошибка:</strong> {results[test.name].error}</p>
                      )}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600">Детали ответа</summary>
                        <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded">
                          {JSON.stringify(results[test.name].data || results[test.name], null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-2">Информация о системе:</h3>
            <ul className="text-sm space-y-1">
              <li><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</li>
              <li><strong>Время:</strong> {new Date().toLocaleString()}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

