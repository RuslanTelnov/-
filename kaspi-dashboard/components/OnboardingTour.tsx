'use client'

import { useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export const OnboardingTour = () => {
    useEffect(() => {
        // Проверяем, проходил ли пользователь тур ранее
        const hasCompletedTour = localStorage.getItem('hasCompletedDashboardTour')

        if (!hasCompletedTour) {
            const driverObj = driver({
                showProgress: true,
                steps: [
                    {
                        element: '#step-balance',
                        popover: {
                            title: 'Общий баланс',
                            description: 'Здесь вы видите общую стоимость всех ваших активов и доступные средства для операций.',
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#step-sync',
                        popover: {
                            title: 'Синхронизация',
                            description: 'Нажмите эту кнопку, чтобы обновить данные из МойСклад и Kaspi в режиме реального времени.',
                            side: "bottom",
                            align: 'end'
                        }
                    },
                    {
                        element: '#step-warehouses',
                        popover: {
                            title: 'Ваши склады',
                            description: 'Топ ваших активов по складам. Нажмите на любой склад, чтобы увидеть детальный список товаров.',
                            side: "top",
                            align: 'start'
                        }
                    },
                    {
                        element: '#step-metrics',
                        popover: {
                            title: 'Ключевые показатели',
                            description: 'Маржинальность, рекомендации по закупкам и неликвидные товары. Все самое важное в одном месте.',
                            side: "top",
                            align: 'center'
                        }
                    },
                    {
                        element: '#step-charts',
                        popover: {
                            title: 'Динамика продаж',
                            description: 'Следите за ростом ваших продаж и заказов в сравнении с прошлым месяцем.',
                            side: "top",
                            align: 'center'
                        }
                    },
                    {
                        element: '#step-agent',
                        popover: {
                            title: 'AI Ассистент',
                            description: 'Наш интеллектуальный помощник всегда готов ответить на вопросы по вашим данным.',
                            side: "left",
                            align: 'center'
                        }
                    }
                ],
                nextBtnText: 'Далее',
                prevBtnText: 'Назад',
                doneBtnText: 'Понятно',
                onDestroyStarted: () => {
                    if (!driverObj.hasNextStep()) {
                        localStorage.setItem('hasCompletedDashboardTour', 'true')
                        driverObj.destroy()
                    } else {
                        // If user skips, we still mark as completed to avoid annoying them
                        // Or we could leave it to show next time. Let's mark as completed for now.
                        localStorage.setItem('hasCompletedDashboardTour', 'true')
                        driverObj.destroy()
                    }
                }
            })

            // Задержка перед запуском, чтобы все элементы успели отрендериться
            const timer = setTimeout(() => {
                driverObj.drive()
            }, 1500)

            return () => clearTimeout(timer)
        }
    }, [])

    return null // Компонент не рендерит ничего в DOM сам по себе
}
