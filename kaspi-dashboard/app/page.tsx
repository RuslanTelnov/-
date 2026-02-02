'use client'

import { useState } from 'react'
import Dashboard from '@/components/Dashboard'
import AIChat from '@/components/AIChat'
import RAGChat from '@/components/RAGChat'

export const dynamic = 'force-dynamic'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai' | 'rag'>('dashboard')

  return (
    <main className="min-h-screen bg-slate-950">
      <header className="bg-fintech-bg/80 backdrop-blur-md border-b border-fintech-border sticky top-0 z-50 shadow-fintech-card">
        <div className="w-full px-6 md:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-fintech-aqua to-fintech-purple rounded-xl shadow-fintech-glow">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-fintech-text-main tracking-tight">Velveto <span className="text-fintech-text-muted font-normal">Analytics</span></h1>
                <p className="text-xs text-fintech-text-muted">Панель управления</p>
              </div>
            </div>
            <nav className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {[
                { id: 'dashboard', label: 'Дашборд' },
                { id: 'ai', label: 'AI Чат' },
                { id: 'rag', label: 'RAG' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-fintech-aqua text-fintech-bg shadow-fintech-glow'
                    : 'text-fintech-text-muted hover:bg-white/5 hover:text-white'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="w-full">
        {activeTab === 'dashboard' && <Dashboard />}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'ai' && <AIChat />}
          {activeTab === 'rag' && <RAGChat />}
        </div>
      </div>
    </main>
  )
}
