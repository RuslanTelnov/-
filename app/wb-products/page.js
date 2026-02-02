'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function WbProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProduct, setSelectedProduct] = useState(null)

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('wb_search_results')
                .select('*')
                .order('rating', { ascending: false })
                .limit(100)

            if (error) throw error
            setProducts(data || [])
        } catch (err) {
            console.error('Error fetching WB products:', err)
            setError('Не удалось загрузить данные')
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(product => {
        const query = searchQuery.toLowerCase()
        return (
            (product.name && product.name.toLowerCase().includes(query)) ||
            (product.id && String(product.id).includes(query))
        )
    })

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)' }}>
            {/* Header */}
            <header style={{
                padding: '1rem 5%',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                backdropFilter: 'blur(20px)',
                background: 'rgba(5, 8, 20, 0.8)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Link href="/">
                            <h1 style={{
                                fontSize: '1.4rem',
                                fontWeight: '300',
                                letterSpacing: '0.18em',
                                color: 'var(--velveto-text-primary)',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                            }}>
                                VELVETO
                            </h1>
                        </Link>
                        <span style={{
                            color: 'var(--velveto-accent-primary)',
                            fontSize: '0.6rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            border: '1px solid var(--velveto-accent-primary)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                        }}>
                            TECH
                        </span>
                    </div>

                    {/* Navigation Tabs */}
                    <nav style={{ display: 'flex', gap: '1.5rem' }}>
                        <Link href="/" style={{
                            color: 'var(--velveto-text-muted)',
                            fontSize: '0.8rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}>
                            Главная
                        </Link>
                        <Link href="/wb-products" style={{
                            color: 'var(--velveto-accent-primary)',
                            fontSize: '0.8rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            fontWeight: '600',
                        }}>
                            WB
                        </Link>
                    </nav>
                </div>
                <div style={{
                    color: 'var(--velveto-text-secondary)',
                    fontSize: '0.7rem',
                    fontWeight: '500',
                    letterSpacing: '0.05em'
                }}>
                    ADMIN PANEL
                </div>
            </header>

            <main className="container" style={{ padding: '2rem 1rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h1 style={{
                            fontSize: 'clamp(1.8rem, 6vw, 3.5rem)',
                            fontWeight: '200',
                            color: 'var(--velveto-text-primary)',
                            marginBottom: '0.5rem',
                            letterSpacing: '0.05em'
                        }}>
                            Номенклатуры <span style={{ color: 'var(--velveto-accent-primary)' }}>WB</span>
                        </h1>
                        <p style={{ color: 'var(--velveto-text-muted)', fontSize: '1rem' }}>
                            Управление и мониторинг товаров Wildberries
                        </p>
                    </div>
                    <button
                        onClick={fetchProducts}
                        className="velveto-button"
                        style={{
                            padding: '0.8rem 1.5rem',
                            width: 'fit-content'
                        }}
                    >
                        Обновить
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <input
                        type="text"
                        placeholder="..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            maxWidth: '600px',
                            padding: '0.8rem 1.25rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            color: 'var(--velveto-text-primary)',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'all 0.3s',
                            fontFamily: 'var(--velveto-font-ui)'
                        }}
                    />
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--velveto-accent-primary)', fontSize: '1.2rem' }}>Загрузка данных...</div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--velveto-status-error)' }}>{error}</div>
                ) : (
                    <motion.div
                        className="ms-table-container"
                        variants={container}
                        initial="hidden"
                        animate="show"
                    >
                        <div style={{ overflowX: 'auto' }}>
                            <table className="ms-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '80px' }}>Фото</th>
                                        <th>Наименование</th>
                                        <th>Бренд</th>
                                        <th style={{ textAlign: 'right' }}>Цена</th>
                                        <th style={{ textAlign: 'right' }}>Рейтинг</th>
                                        <th style={{ textAlign: 'right' }}>Доставка</th>
                                        <th style={{ textAlign: 'right' }}>Обновлено</th>
                                        <th style={{ textAlign: 'center' }}>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => (
                                        <motion.tr key={product.id} variants={item}>
                                            <td data-label="Фото">
                                                {(product.image_url || (product.images && product.images.length > 0)) ? (
                                                    <img
                                                        src={product.image_url || product.images[0]}
                                                        alt={product.name}
                                                        className="ms-thumb"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => setSelectedProduct(product)}
                                                    />
                                                ) : (
                                                    <div className="ms-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--velveto-text-muted)' }}>
                                                        Нет
                                                    </div>
                                                )}
                                            </td>
                                            <td data-label="Наименование" className="ms-cell-name">
                                                <div style={{ marginBottom: '0.25rem', color: 'var(--velveto-text-primary)', fontWeight: '500' }}>{product.name}</div>
                                                <div className="ms-cell-article" style={{ color: 'var(--velveto-text-muted)' }}>Art: {product.id}</div>
                                            </td>
                                            <td data-label="Бренд" style={{ color: 'var(--velveto-text-secondary)' }}>{product.brand}</td>
                                            <td data-label="Цена" className="ms-cell-price" style={{ textAlign: 'right', color: 'var(--velveto-accent-primary)', fontWeight: '600' }}>
                                                {(product.sale_price_u || product.price)
                                                    ? (product.currency === 'KZT'
                                                        ? `${(product.sale_price_u || product.price).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸`
                                                        : `${((product.sale_price_u || product.price) * 5.2).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸`)
                                                    : 'Нет цены'}
                                            </td>
                                            <td data-label="Рейтинг" style={{ textAlign: 'right', color: 'var(--velveto-text-primary)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                                    <span style={{ color: '#F59E0B' }}>★</span> {product.rating}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--velveto-text-muted)', marginTop: '0.1rem' }}>
                                                    {product.feedbacks} отзывов
                                                </div>
                                            </td>
                                            <td data-label="Доставка" style={{ textAlign: 'right', color: 'var(--velveto-text-secondary)' }}>
                                                {product.delivery_date || '—'}
                                            </td>
                                            <td data-label="Обновлено" style={{ textAlign: 'right', color: 'var(--velveto-text-muted)', fontSize: '0.85rem' }}>
                                                {product.updated_at
                                                    ? new Date(product.updated_at).toLocaleString('ru-RU', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : '—'}
                                            </td>
                                            <td data-label="Действия" style={{ textAlign: 'center' }}>
                                                <button
                                                    onClick={() => setSelectedProduct(product)}
                                                    className="velveto-button-outline"
                                                    style={{
                                                        padding: '0.4rem 0.8rem',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    Подробнее
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Specs Modal */}
                {selectedProduct && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(5, 8, 20, 0.9)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: '2rem'
                    }} onClick={() => setSelectedProduct(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="velveto-card"
                            style={{
                                padding: '2rem',
                                maxWidth: '900px',
                                width: '100%',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                position: 'relative',
                                border: '1px solid var(--velveto-accent-primary)',
                                boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedProduct(null)}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--velveto-text-muted)',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    zIndex: 10,
                                    lineHeight: 1
                                }}
                            >
                                ×
                            </button>

                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto', flexShrink: 0 }}>
                                    {/* Main Image */}
                                    {selectedProduct.image_url && (
                                        <img
                                            src={selectedProduct.image_url}
                                            alt={selectedProduct.name}
                                            style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}
                                        />
                                    )}
                                    {/* Gallery Grid */}
                                    {selectedProduct.images && selectedProduct.images.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                                            {selectedProduct.images.slice(0, 8).map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={img}
                                                    alt={`Gallery ${idx}`}
                                                    style={{
                                                        width: '100%',
                                                        aspectRatio: '3/4',
                                                        objectFit: 'cover',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        border: selectedProduct.image_url === img ? '2px solid var(--velveto-accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                                                        opacity: selectedProduct.image_url === img ? 1 : 0.7
                                                    }}
                                                    onClick={() => setSelectedProduct({ ...selectedProduct, image_url: img })}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: '280px' }}>
                                    <h2 style={{
                                        fontSize: '1.4rem',
                                        marginBottom: '0.4rem',
                                        color: 'var(--velveto-text-primary)',
                                        lineHeight: '1.2',
                                        fontWeight: '300'
                                    }}>
                                        {selectedProduct.name}
                                    </h2>
                                    <div style={{ color: 'var(--velveto-text-muted)', marginBottom: '1rem', fontSize: '1rem' }}>{selectedProduct.brand}</div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ color: 'var(--velveto-accent-primary)', fontSize: '1.5rem', fontWeight: '600' }}>
                                            {(selectedProduct.currency === 'KZT'
                                                ? `${(selectedProduct.sale_price_u || selectedProduct.price).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸`
                                                : `${((selectedProduct.sale_price_u || selectedProduct.price) * 5.2).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸`)
                                            }
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--velveto-text-primary)' }}>
                                            <span style={{ color: '#F59E0B' }}>★</span> {selectedProduct.rating}
                                        </div>
                                    </div>

                                    <a
                                        href={selectedProduct.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="velveto-button"
                                        style={{
                                            display: 'block',
                                            padding: '0.8rem 1.5rem',
                                            textDecoration: 'none',
                                            marginBottom: '2rem',
                                            textAlign: 'center'
                                        }}
                                    >
                                        Купить на WB ↗
                                    </a>

                                    <h3 style={{
                                        fontSize: '1rem',
                                        marginBottom: '1rem',
                                        color: 'var(--velveto-text-primary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                                        paddingBottom: '0.5rem'
                                    }}>
                                        Характеристики
                                    </h3>
                                    <div style={{ display: 'grid', gap: '0.8rem' }}>
                                        {selectedProduct.specs && Object.entries(selectedProduct.specs).map(([key, value]) => (
                                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--velveto-text-muted)', flexShrink: 0, paddingRight: '1rem' }}>{key}</span>
                                                <span style={{ color: 'var(--velveto-text-secondary)', textAlign: 'right' }}>{value}</span>
                                            </div>
                                        ))}
                                        {(!selectedProduct.specs || Object.keys(selectedProduct.specs).length === 0) && (
                                            <div style={{ color: 'var(--velveto-text-muted)', fontSize: '0.9rem' }}>Нет характеристик</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    )
}
