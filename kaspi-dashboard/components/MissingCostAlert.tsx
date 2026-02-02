import { useState } from 'react'
import { AlertTriangle, X, ChevronRight } from 'lucide-react'

interface Product {
    id: string
    article: string
    name: string
    cost_price: number
    sale_price: number
}

interface MissingCostAlertProps {
    products: Product[]
}

export function MissingCostAlert({ products }: MissingCostAlertProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [showModal, setShowModal] = useState(false)

    if (!products || products.length === 0) return null

    return (
        <>
            {/* Alert Banner */}
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4 backdrop-blur-sm dark:border-amber-900/30 dark:bg-amber-900/10">
                <div className="flex items-start gap-4">
                    <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-amber-900 dark:text-amber-200">
                            Внимание: Отсутствует себестоимость
                        </h3>
                        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300/80">
                            У <strong>{products.length}</strong> товаров не указана себестоимость (0 ₸).
                            Это приводит к некорректному расчету маржи (отображается как 100%).
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-3 flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                            Показать список товаров
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                                        Товары без себестоимости
                                    </h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Необходимо указать закупочную цену в МойСклад
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="h-5 w-5 text-zinc-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-1">
                                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    <div className="col-span-3">Артикул</div>
                                    <div className="col-span-9">Наименование</div>
                                </div>

                                {products.map((product) => (
                                    <div
                                        key={product.id}
                                        className="grid grid-cols-12 gap-4 rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50"
                                    >
                                        <div className="col-span-3 font-mono text-sm text-zinc-600 dark:text-zinc-400">
                                            {product.article}
                                        </div>
                                        <div className="col-span-9 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {product.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-2xl">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
