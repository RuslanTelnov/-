
import React, { useState } from 'react'
import { Bot, ShoppingCart, Sparkles, X } from 'lucide-react'
import { OrderListModal } from './OrderListModal'

export function AgentPanel() {
    const [isOpen, setIsOpen] = useState(false)
    const [showOrderModal, setShowOrderModal] = useState(false)

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center text-white"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-8 w-8" />}
                </button>
            </div>

            {/* Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-80 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="border border-indigo-200 shadow-xl bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-xl overflow-hidden">
                        <div className="bg-indigo-50/50 border-b border-indigo-100 p-4 pb-3">
                            <div className="flex items-center gap-2 text-lg font-semibold text-indigo-900">
                                <Sparkles className="h-5 w-5 text-indigo-500" />
                                Бизнес-Ассистент
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="text-sm text-gray-600 mb-2">
                                Я проанализировал ваши продажи и остатки. Вот что я рекомендую:
                            </div>

                            <button
                                className="w-full flex items-center justify-start gap-3 h-auto py-3 px-4 border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors bg-white"
                                onClick={() => setShowOrderModal(true)}
                            >
                                <div className="bg-indigo-100 p-2 rounded-full shrink-0">
                                    <ShoppingCart className="h-4 w-4 text-indigo-600" />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-sm text-gray-900">Сформировать заказ</div>
                                    <div className="text-xs text-gray-500">На основе продаж за 30 дней</div>
                                </div>
                            </button>

                            {/* Placeholder for future features */}
                            <div className="pt-2 border-t border-gray-100">
                                <div className="text-xs text-gray-400 text-center">
                                    Больше функций скоро...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <OrderListModal
                open={showOrderModal}
                onOpenChange={setShowOrderModal}
            />
        </>
    )
}
