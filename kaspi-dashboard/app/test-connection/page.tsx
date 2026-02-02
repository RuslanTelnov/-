'use client'

import { useState } from 'react'

export default function TestConnectionPage() {
  const [loading, setLoading] = useState(false)
  const [detailedLoading, setDetailedLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [detailedResult, setDetailedResult] = useState<any>(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setDetailedResult(null)

    try {
      const response = await fetch('/api/test-moy-sklad')
      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data)
      }
    } catch (err: any) {
      setError({ error: err.message, message: 'Ошибка при проверке подключения' })
    } finally {
      setLoading(false)
    }
  }

  const testDetailed = async () => {
    setDetailedLoading(true)
    setDetailedResult(null)

    try {
      const response = await fetch('/api/test-moy-sklad/detailed')
      const data = await response.json()
      setDetailedResult(data)
    } catch (err: any) {
      setDetailedResult({
        success: false,
        error: err.message
      })
    } finally {
      setDetailedLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-6">Проверка подключения к Мой склад</h1>

          <div className="mb-6 flex gap-4">
            <button
              onClick={testConnection}
              disabled={loading || detailedLoading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Проверка...' : 'Проверить подключение'}
            </button>
            <button
              onClick={testDetailed}
              disabled={loading || detailedLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {detailedLoading ? 'Диагностика...' : 'Детальная диагностика'}
            </button>
          </div>

          {loading && (
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              <span>Проверяю подключение к API Мой склад...</span>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h2 className="text-xl font-semibold text-green-800 mb-2">✅ Подключение успешно!</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Метод аутентификации:</strong> {result.details.authMethod}</p>
                <p><strong>URL API:</strong> {result.details.apiUrl}</p>
                {result.details.totalProducts !== undefined && (
                  <p><strong>Всего товаров в системе:</strong> {result.details.totalProducts}</p>
                )}
                {result.details.sample && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="font-semibold mb-2">Пример товара:</p>
                    <p><strong>ID:</strong> {result.details.sample.id}</p>
                    <p><strong>Название:</strong> {result.details.sample.name}</p>
                    <p><strong>Артикул:</strong> {result.details.sample.article || 'не указан'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h2 className="text-xl font-semibold text-red-800 mb-2">❌ Ошибка подключения</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Ошибка:</strong> {error.error || error.message}</p>
                {error.details && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="font-semibold mb-2">Детали:</p>
                    {error.details.status && (
                      <p><strong>Статус:</strong> {error.details.status} {error.details.statusText}</p>
                    )}
                    {error.details.message && (
                      <p><strong>Сообщение:</strong> {error.details.message}</p>
                    )}
                    {error.details.errorData && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <p className="font-semibold mb-1">Данные ошибки:</p>
                        <pre className="text-xs overflow-auto">{JSON.stringify(error.details.errorData, null, 2)}</pre>
                      </div>
                    )}
                    {error.details.hasToken !== undefined && (
                      <div className="mt-2">
                        <p><strong>Настройки:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                          <li>Токен: {error.details.hasToken ? '✅ установлен' : '❌ не установлен'}</li>
                          <li>Логин: {error.details.hasUsername ? '✅ установлен' : '❌ не установлен'}</li>
                          <li>Пароль: {error.details.hasPassword ? '✅ установлен' : '❌ не установлен'}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {error.troubleshooting && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="font-semibold mb-1">💡 Решение:</p>
                    <p>{error.troubleshooting}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {detailedResult && (
            <div className={`border rounded-lg p-4 mb-4 ${detailedResult.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <h2 className="text-xl font-semibold mb-3">🔍 Детальная диагностика</h2>

              {detailedResult.diagnostics && (
                <div className="mb-4 p-3 bg-white rounded border">
                  <p className="font-semibold mb-2">Настройки окружения:</p>
                  <ul className="text-sm space-y-1">
                    <li><strong>API URL:</strong> {detailedResult.diagnostics.apiUrl}</li>
                    <li><strong>Токен:</strong> {detailedResult.diagnostics.hasToken ? `✅ (${detailedResult.diagnostics.tokenLength} символов)` : '❌ не установлен'}</li>
                    <li><strong>Логин:</strong> {detailedResult.diagnostics.hasUsername ? '✅ установлен' : '❌ не установлен'}</li>
                    <li><strong>Пароль:</strong> {detailedResult.diagnostics.hasPassword ? '✅ установлен' : '❌ не установлен'}</li>
                    {detailedResult.diagnostics.tokenPreview && (
                      <li><strong>Превью токена:</strong> {detailedResult.diagnostics.tokenPreview}</li>
                    )}
                  </ul>
                </div>
              )}

              {detailedResult.directTest && (
                <div className="mb-4 p-3 bg-white rounded border">
                  <p className="font-semibold mb-2">Прямой тест API:</p>
                  {detailedResult.directTest.status ? (
                    <div className="text-sm space-y-1">
                      <p><strong>Статус:</strong> {detailedResult.directTest.status} {detailedResult.directTest.statusText}</p>
                      {detailedResult.directTest.error && (
                        <div className="mt-2 p-2 bg-red-50 rounded">
                          <p className="font-semibold mb-1">Ошибка:</p>
                          <pre className="text-xs overflow-auto">{JSON.stringify(detailedResult.directTest.error, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm">
                      <p className="text-red-600">❌ Ошибка: {detailedResult.directTest.error || detailedResult.directTest.message}</p>
                      {detailedResult.directTest.response && (
                        <div className="mt-2 p-2 bg-red-50 rounded">
                          <pre className="text-xs overflow-auto">{JSON.stringify(detailedResult.directTest.response, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {detailedResult.clientTest && (
                <div className="mb-4 p-3 bg-white rounded border">
                  <p className="font-semibold mb-2">Тест через клиент:</p>
                  {detailedResult.clientTest.success ? (
                    <div className="text-sm text-green-700">
                      <p>✅ Успешно подключено!</p>
                      {detailedResult.clientTest.totalProducts !== undefined && (
                        <p><strong>Всего товаров:</strong> {detailedResult.clientTest.totalProducts}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      <p>❌ Ошибка: {detailedResult.clientTest.error}</p>
                      {detailedResult.clientTest.response && (
                        <div className="mt-2 p-2 bg-red-50 rounded">
                          <p><strong>Статус:</strong> {detailedResult.clientTest.response.status} {detailedResult.clientTest.response.statusText}</p>
                          {detailedResult.clientTest.response.data && (
                            <pre className="text-xs overflow-auto mt-1">{JSON.stringify(detailedResult.clientTest.response.data, null, 2)}</pre>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {detailedResult.recommendations && detailedResult.recommendations.length > 0 && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="font-semibold mb-2">💡 Рекомендации:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {detailedResult.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-2">📝 Инструкция по настройке:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Откройте файл <code className="bg-white px-1 rounded">.env.local</code> в корне проекта</li>
              <li>Добавьте один из вариантов:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li><code>MOY_SKLAD_TOKEN=ваш_токен</code> (рекомендуется)</li>
                  <li>ИЛИ <code>MOY_SKLAD_USERNAME=логин</code> и <code>MOY_SKLAD_PASSWORD=пароль</code></li>
                </ul>
              </li>
              <li>Сохраните файл и перезапустите сервер (если он запущен)</li>
              <li>Нажмите кнопку "Проверить подключение" выше</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

