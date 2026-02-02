import { NextResponse } from 'next/server'
import { createMoySkladClient } from '@/lib/moy-sklad/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const apiUrl = process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2'
    const token = process.env.MOY_SKLAD_TOKEN
    const username = process.env.MOY_SKLAD_USERNAME
    const password = process.env.MOY_SKLAD_PASSWORD

    // Проверяем наличие учетных данных
    if (!token && (!username || !password)) {
      return NextResponse.json({
        success: false,
        error: 'Не настроены учетные данные для Мой склад',
        details: {
          hasToken: !!token,
          hasUsername: !!username,
          hasPassword: !!password,
        },
        message: 'Добавьте MOY_SKLAD_TOKEN или MOY_SKLAD_USERNAME/PASSWORD в .env.local',
      }, { status: 400 })
    }

    // Создаем клиент
    const client = createMoySkladClient({
      apiUrl,
      token,
      username,
      password,
    })

    // Пробуем получить данные (простейший запрос - список товаров с лимитом 1)
    try {
      const data = await client.getProducts({ limit: 1 })

      return NextResponse.json({
        success: true,
        message: 'Подключение к Мой склад успешно!',
        details: {
          apiUrl,
          authMethod: token ? 'token' : 'username/password',
          hasData: !!data,
          totalProducts: data.meta?.size || 0,
          sample: data.rows?.[0] ? {
            id: data.rows[0].id,
            name: data.rows[0].name,
            article: data.rows[0].article,
          } : null,
        },
      })
    } catch (apiError: any) {
      console.error('Moy Sklad API Error:', {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
        config: {
          url: apiError.config?.url,
          method: apiError.config?.method,
          headers: apiError.config?.headers ? Object.keys(apiError.config.headers) : null,
        },
      })
      // Обрабатываем различные типы ошибок
      if (apiError.response) {
        const status = apiError.response.status
        const statusText = apiError.response.statusText
        const errorData = apiError.response.data

        return NextResponse.json({
          success: false,
          error: `Ошибка API Мой склад: ${status} ${statusText}`,
          details: {
            status,
            statusText,
            errorData,
            message: errorData?.error || errorData?.errors?.[0]?.error || 'Неизвестная ошибка',
          },
          troubleshooting: {
            '401': 'Неверный токен или логин/пароль. Проверьте учетные данные.',
            '403': 'Нет прав доступа. Проверьте права пользователя.',
            '404': 'Ресурс не найден. Возможно, неверный URL API.',
            '429': 'Превышен лимит запросов. Попробуйте позже.'
          }[String(status)] || 'Проверьте логи сервера для деталей.',
        }, { status: 500 })
      }

      // Ошибка сети или другая ошибка
      return NextResponse.json({
        success: false,
        error: 'Ошибка подключения к Мой склад',
        details: {
          message: apiError.message,
          code: apiError.code,
        },
        troubleshooting: 'Проверьте интернет-соединение и доступность API Мой склад',
      }, { status: 500 })
    }
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

