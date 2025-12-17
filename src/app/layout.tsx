import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BestBite - 食品庫存管理',
  description: '智慧食品庫存管理應用，使用 AI 辨識食品與有效期限',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#10B981',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-green-600 text-white p-4 shadow-md">
          <h1 className="text-title font-bold text-center">BestBite</h1>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          {children}
        </main>
      </body>
    </html>
  )
}
