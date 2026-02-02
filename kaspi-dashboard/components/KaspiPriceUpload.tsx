import React, { useState, useRef } from 'react'
import ExcelJS from 'exceljs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function KaspiPriceUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setMessage('Чтение файла...')

        try {
            const buffer = await file.arrayBuffer()
            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.load(buffer)
            const worksheet = workbook.getWorksheet(1)

            if (!worksheet) {
                throw new Error('Не удалось прочитать первый лист Excel')
            }

            const updates: { article: string; price: number }[] = []
            let articleCol = -1
            let priceCol = -1

            // 1. Find columns
            const headerRow = worksheet.getRow(1)
            headerRow.eachCell((cell, colNumber) => {
                const val = cell.value?.toString().toLowerCase() || ''
                if (val.includes('sku') || val.includes('артикул') || val.includes('код')) {
                    articleCol = colNumber
                }
                if (val.includes('price') || val.includes('цена')) {
                    priceCol = colNumber
                }
            })

            if (articleCol === -1 || priceCol === -1) {
                // Fallback: assume 1st is Article, 2nd is Price if headers missing
                // But better to error out or try row 2
                console.warn('Headers not found, trying standard columns A=Article, B=Price')
                articleCol = 1
                priceCol = 2
            }

            // 2. Parse rows
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return // Skip header

                const article = row.getCell(articleCol).text?.trim()
                const priceRaw = row.getCell(priceCol).value

                let price = 0
                if (typeof priceRaw === 'number') {
                    price = priceRaw
                } else if (typeof priceRaw === 'string') {
                    price = parseFloat(priceRaw.replace(/[^\d.]/g, ''))
                }

                if (article && price > 0) {
                    updates.push({ article, price })
                }
            })

            setMessage(`Найдено ${updates.length} товаров. Обновляем базу...`)

            // 3. Batch update Supabase
            // We can't do bulk update easily with different values for different rows in one query
            // So we'll use upsert with a loop or small batches

            // Optimization: Fetch all products first to map Article -> ID
            const { data: products } = await supabase
                .from('products')
                .select('id, article')

            const productMap = new Map(products?.map(p => [p.article, p.id]))

            let updatedCount = 0
            const batchSize = 50

            for (let i = 0; i < updates.length; i += batchSize) {
                const chunk = updates.slice(i, i + batchSize)

                // Prepare upsert data
                // We only want to update kaspi_price. 
                // upsert requires a unique constraint. 'id' is unique.

                const upsertData = chunk
                    .map(u => {
                        const id = productMap.get(u.article)
                        if (!id) return null
                        return {
                            id,
                            kaspi_price: u.price,
                            updated_at: new Date().toISOString()
                        }
                    })
                    .filter(Boolean) as any[]

                if (upsertData.length > 0) {
                    const { error } = await supabase
                        .from('products')
                        .upsert(upsertData) // Upsert works if we provide ID

                    if (error) {
                        console.error('Error updating chunk:', error)
                    } else {
                        updatedCount += upsertData.length
                    }
                }

                setMessage(`Обновлено ${updatedCount} из ${updates.length}...`)
            }

            setMessage(`✅ Готово! Обновлено цен: ${updatedCount}`)
            setTimeout(() => {
                setMessage('')
                onUploadComplete()
            }, 2000)

        } catch (error: any) {
            console.error('Upload error:', error)
            setMessage(`❌ Ошибка: ${error.message}`)
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    return (
        <div className="flex items-center gap-2">
            <input
                type="file"
                accept=".xlsx"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`
          px-4 py-2 rounded-lg text-sm font-medium transition-all
          ${uploading
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-[#0089D0] hover:bg-[#0073af] text-white shadow-lg shadow-blue-900/20'
                    }
        `}
            >
                {uploading ? 'Загрузка...' : '📥 Загрузить цены Kaspi (Excel)'}
            </button>
            {message && (
                <span className="text-xs text-gray-400 animate-pulse">
                    {message}
                </span>
            )}
        </div>
    )
}
