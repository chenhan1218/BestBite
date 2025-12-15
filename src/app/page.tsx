'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CameraButton, ImageUpload, ImagePreview } from '@/components/Camera'
import { CaptureResult } from '@/types'

export default function Home() {
  const [capturedImage, setCapturedImage] = useState<CaptureResult | null>(null)
  const [error, setError] = useState<string>('')

  const handleImageSelected = (result: CaptureResult) => {
    setCapturedImage(result)
    setError('')
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setCapturedImage(null)
  }

  const handleRetry = () => {
    setCapturedImage(null)
    setError('')
  }

  const handleConfirm = async () => {
    // TODO: Phase 3 - Call Gemini API
    console.log('Image confirmed, ready to send to Gemini API')
    alert('AI 識別功能將在階段 3 實作')
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          歡迎使用 BestBite
        </h2>
        <p className="text-center text-gray-600 mb-6">
          拍攝食品包裝，AI 自動辨識品名與有效期限
        </p>

        {/* Image Preview or Camera Button */}
        {capturedImage ? (
          <ImagePreview
            imageUrl={capturedImage.dataUrl}
            onRetry={handleRetry}
            onConfirm={handleConfirm}
            showActions={true}
          />
        ) : (
          <div className="flex flex-col items-center">
            <ImageUpload
              onImageSelected={handleImageSelected}
              onError={handleError}
            >
              <CameraButton />
            </ImageUpload>
            <p className="text-center text-sm text-gray-500 mt-4">
              點擊拍攝或上傳食品照片
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}
      </section>

      <section className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-3">快速統計</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-status-red">0</div>
            <div className="text-sm text-gray-600 mt-1">緊急</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-status-yellow">0</div>
            <div className="text-sm text-gray-600 mt-1">注意</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-status-green">0</div>
            <div className="text-sm text-gray-600 mt-1">安全</div>
          </div>
        </div>
      </section>

      <section className="text-center">
        <Link
          href="/inventory"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow text-lg"
        >
          查看完整庫存 →
        </Link>
      </section>
    </div>
  )
}
