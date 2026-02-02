'use client'

import { useState, useEffect } from 'react'

export default function VerifyPage() {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkDatabase()
  }, [])

  const checkDatabase = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/verify')
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Проверка базы данных...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка проверки</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={checkDatabase}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  const allTablesExist = result?.tables && Object.values(result.tables).every((t: any) => t.exists)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Проверка базы данных</h1>
          
          {result?.success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              ✅ Все таблицы созданы успешно!
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
              ⚠️ Некоторые таблицы отсутствуют или есть проблемы
            </div>
          )}

          <div className="mb-4">
            <button
              onClick={checkDatabase}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Обновить проверку
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold mb-4">Статус таблиц:</h2>
            {result?.tables && Object.entries(result.tables).map(([table, info]: [string, any]) => (
              <div
                key={table}
                className={`p-3 rounded ${
                  info.exists ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{table}</span>
                  <span className={info.exists ? 'text-green-600' : 'text-red-600'}>
                    {info.exists ? '✅ Существует' : `❌ ${info.error || 'Не найдена'}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {result?.productsStructure && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold mb-2">Структура таблицы products:</h3>
              <p className={result.productsStructure === 'OK' ? 'text-green-600' : 'text-red-600'}>
                {result.productsStructure === 'OK' ? '✅ Все столбцы на месте' : '❌ Проблемы со структурой'}
              </p>
            </div>
          )}

          {allTablesExist && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-semibold mb-2">🎉 Готово к работе!</h3>
              <p className="text-sm text-gray-700">
                Все таблицы созданы. Теперь вы можете:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                <li>Добавить ключи от "Мой склад" в .env.local</li>
                <li>Перейти на вкладку "Синхронизация"</li>
                <li>Начать синхронизацию данных</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

