import type { Metadata } from 'next'
import './globals.css'
import { FoodProvider } from '@/context/FoodContext'

export const metadata: Metadata = {
  title: 'BestBite - 食品庫存管理',
  description: '智慧食品庫存管理應用，使用 AI 辨識食品與有效期限',
  manifest: '/manifest.json',
  themeColor: '#10B981',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className="bg-gray-50 min-h-screen">
        <FoodProvider>
          <header className="bg-green-600 text-white p-4 shadow-md">
            <h1 className="text-title font-bold text-center">BestBite</h1>
          </header>
          <main className="container mx-auto px-4 py-6 max-w-2xl">
            {children}
          </main>
        </FoodProvider>
      </body>
    </html>
  )
}
