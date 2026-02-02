import { NextResponse } from 'next/server'
import { createMoySkladClient } from '@/lib/moy-sklad/client'
import axios from 'axios'

export async function GET() {
  try {
    const apiUrl = process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2'
    const token = process.env.MOY_SKLAD_TOKEN
    const username = process.env.MOY_SKLAD_USERNAME
    const password = process.env.MOY_SKLAD_PASSWORD

    const diagnostics: any = {
      apiUrl,
      hasToken: !!token,
      hasUsername: !!username,
      hasPassword: !!password,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'не установлен',
    }

    // Проверяем наличие учетных данных
    if (!token && (!username || !password)) {
      return NextResponse.json({
        success: false,
        error: 'Не настроены учетные данные для Мой склад',
        diagnostics,
        message: 'Добавьте MOY_SKLAD_TOKEN или MOY_SKLAD_USERNAME/PASSWORD в .env.local',
      }, { status: 400 })
    }

    // Пробуем подключиться напрямую для диагностики
    let directTest: any = null
    try {
      const testHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (token) {
        if (token.includes(':')) {
          // Это логин:пароль, используем Basic Auth
          testHeaders['Authorization'] = `Basic ${Buffer.from(token).toString('base64')}`
        } else {
          // Это API токен - используем Bearer формат
          testHeaders['Authorization'] = `Bearer ${token}`
        }
      } else if (username && password) {
        const credentials = Buffer.from(`${username}:${password}`).toString('base64')
        testHeaders['Authorization'] = `Basic ${credentials}`
      }

      const testResponse = await axios.get(`${apiUrl}/entity/product?limit=1`, {
        headers: testHeaders,
        validateStatus: () => true, // Не выбрасывать ошибку на любой статус
      })

      directTest = {
        status: testResponse.status,
        statusText: testResponse.statusText,
        hasData: !!testResponse.data,
        error: testResponse.status >= 400 ? testResponse.data : null,
        headers: Object.keys(testResponse.headers),
      }
    } catch (directError: any) {
      directTest = {
        error: directError.message,
        code: directError.code,
        response: directError.response ? {
          status: directError.response.status,
          statusText: directError.response.statusText,
          data: directError.response.data,
        } : null,
      }
    }

    // Создаем клиент
    const client = createMoySkladClient({
      apiUrl,
      token,
      username,
      password,
    })

    // Пробуем получить данные
    let clientTest: any = null
    try {
      const data = await client.getProducts({ limit: 1 })
      clientTest = {
        success: true,
        totalProducts: data.meta?.size || 0,
        hasRows: !!data.rows && data.rows.length > 0,
      }
    } catch (clientError: any) {
      clientTest = {
        success: false,
        error: clientError.message,
        response: clientError.response ? {
          status: clientError.response.status,
          statusText: clientError.response.statusText,
          data: clientError.response.data,
        } : null,
      }
    }

    return NextResponse.json({
      success: clientTest?.success || false,
      diagnostics,
      directTest,
      clientTest,
      recommendations: getRecommendations(directTest, clientTest),
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Критическая ошибка',
      details: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    }, { status: 500 })
  }
}

function getRecommendations(directTest: any, clientTest: any): string[] {
  const recommendations: string[] = []

  if (directTest?.status === 401) {
    recommendations.push('Ошибка 401: Неверные учетные данные. Проверьте логин и пароль.')
    recommendations.push('Убедитесь, что используете правильный формат: MOY_SKLAD_TOKEN=логин:пароль')
  }

  if (directTest?.status === 403) {
    recommendations.push('Ошибка 403: Недостаточно прав доступа.')
    recommendations.push('Проверьте права пользователя в настройках Мой склад.')
  }

  if (directTest?.status === 404) {
    recommendations.push('Ошибка 404: Эндпоинт не найден.')
    recommendations.push('Проверьте правильность URL API.')
  }

  if (directTest?.code === 'ECONNREFUSED' || directTest?.code === 'ENOTFOUND') {
    recommendations.push('Ошибка сети: Не удается подключиться к API.')
    recommendations.push('Проверьте интернет-соединение и доступность api.moysklad.ru')
  }

  if (!directTest && !clientTest) {
    recommendations.push('Не удалось выполнить тестовый запрос.')
    recommendations.push('Проверьте настройки в .env.local и перезапустите сервер.')
  }

  return recommendations
}

