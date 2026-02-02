'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function NewProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchProducts()

        const channel = supabase
            .channel('products_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'Parser',
                    table: 'products'
                },
                (payload) => {
                    console.log('Change received!', payload)
                    fetchProducts()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    async function fetchProducts() {
        try {
            // Filter products created after this timestamp (clearing current list)
            const cutoffTime = '2025-12-07T13:50:00.000Z'

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('stock', 0)
                .gt('created_at', cutoffTime)
                .order('created_at', { ascending: false })

            if (error) throw error
            setProducts(data || [])
        } catch (error) {
            console.error('Error fetching products:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(product => {
        const query = searchQuery.toLowerCase()
        return (
            (product.name && product.name.toLowerCase().includes(query)) ||
            (product.article && String(product.article).toLowerCase().includes(query))
        )
    })

    if (loading) return <div className="container"><h1 className="title-gradient">Загрузка...</h1></div>

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    const handleImageClick = (e, imageUrl) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedImage(imageUrl)
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)' }}>
            {/* Image Modal */}
            {selectedImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(5, 8, 20, 0.95)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            background: 'var(--velveto-bg-secondary)',
                            padding: '0.5rem',
                            borderRadius: '16px',
                            maxWidth: '500px',
                            maxHeight: '80vh',
                            width: '90%',
                            position: 'relative',
                            cursor: 'default',
                            border: '1px solid var(--velveto-accent-primary)',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: 'absolute',
                                top: '-15px',
                                right: '-15px',
                                background: 'var(--velveto-status-error)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                zIndex: 10
                            }}
                        >
                            ✕
                        </button>
                        <img
                            src={selectedImage}
                            alt="Preview"
                            style={{
                                width: '100%',
                                height: 'auto',
                                borderRadius: '12px',
                                objectFit: 'contain',
                                maxHeight: '75vh'
                            }}
                        />
                    </motion.div>
                </div>
            )}

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
                        <Link href="/new-products" style={{
                            color: 'var(--velveto-accent-primary)',
                            fontSize: '0.8rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            fontWeight: '600',
                        }}>
                            NEW
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
                <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: 'clamp(1.8rem, 6vw, 3.5rem)',
                        marginBottom: '1rem',
                        color: 'var(--velveto-text-primary)',
                        fontWeight: '200',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                    }}>
                        Новые <span style={{ color: 'var(--velveto-accent-primary)' }}>номенклатуры</span>
                    </h2>
                    <p style={{ color: 'var(--velveto-text-muted)', fontSize: '1rem' }}>
                        Список недавно созданных позиций
                    </p>
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

                <motion.div
                    className="ms-table-container"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    <table className="ms-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Фото</th>
                                <th>Наименование</th>
                                <th>Артикул</th>
                                <th>Мин. цена</th>
                                <th>Розничная</th>
                                <th>Себестоимость</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product, index) => (
                                <Link key={product.id} href={`/product/${product.id}`} legacyBehavior>
                                    <motion.tr variants={item} style={{ cursor: 'pointer' }}>
                                        <td data-label="Фото">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="ms-thumb"
                                                    style={{ cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.1)' }}
                                                    onClick={(e) => handleImageClick(e, product.image_url)}
                                                />
                                            ) : (
                                                <div className="ms-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--velveto-text-muted)' }}>
                                                    Нет
                                                </div>
                                            )}
                                        </td>
                                        <td data-label="Наименование" className="ms-cell-name" style={{ color: 'var(--velveto-text-primary)' }}>{product.name}</td>
                                        <td data-label="Артикул" className="ms-cell-article" style={{ color: 'var(--velveto-text-muted)' }}>{product.article}</td>
                                        <td data-label="Мин. цена" style={{ fontWeight: '600', color: 'var(--velveto-status-warning)' }}>
                                            {product.min_price ? (product.min_price / 100).toLocaleString('ru-RU') : 0} ₸
                                        </td>
                                        <td data-label="Розничная" className="ms-cell-price" style={{ color: 'var(--velveto-accent-primary)' }}>
                                            {product.price ? (product.price / 100).toLocaleString('ru-RU') : 0} ₸
                                        </td>
                                        <td data-label="Себестоимость">
                                            {product.cost_price && (
                                                <span className="cost-price" style={{ color: 'var(--velveto-text-secondary)' }}>
                                                    {(Number(product.cost_price)).toLocaleString('ru-RU')} ₸
                                                </span>
                                            )}
                                        </td>
                                    </motion.tr>
                                </Link>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </main>
        </div>
    )
}
