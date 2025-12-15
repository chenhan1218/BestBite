'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CameraButton, ImageUpload, ImagePreview } from '@/components/Camera'
import { ConfirmationModal } from '@/components/Modal'
import { CaptureResult, GeminiResponse } from '@/types'
import { fileToBase64, getMimeType } from '@/lib/image'

export default function Home() {
  const [capturedImage, setCapturedImage] = useState<CaptureResult | null>(null)
  const [error, setError] = useState<string>('')
  const [recognizing, setRecognizing] = useState(false)
  const [aiResult, setAiResult] = useState<GeminiResponse | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

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
    setAiResult(null)
    setShowModal(false)
    setError('')
  }

  const handleConfirm = async () => {
    if (!capturedImage) return

    setRecognizing(true)
    setError('')

    try {
      // Convert image to base64
      const base64 = await fileToBase64(capturedImage.file)
      const mimeType = getMimeType(capturedImage.file)

      // Call Gemini API
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          mimeType: mimeType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI recognition failed')
      }

      const result: GeminiResponse = await response.json()

      // Show confirmation modal with AI result
      setAiResult(result)
      setShowModal(true)

    } catch (err) {
      console.error('Error calling Gemini API:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'AI recognition failed. Please try again.'
      )
    } finally {
      setRecognizing(false)
    }
  }

  const handleModalConfirm = async (productName: string, expiryDate: string) => {
    setSaving(true)

    try {
      // TODO: Phase 4 - Save to Firestore
      console.log('Saving to Firestore:', { productName, expiryDate })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert(`Product saved!\nName: ${productName}\nExpiry: ${expiryDate}`)

      // Reset state
      setCapturedImage(null)
      setAiResult(null)
      setShowModal(false)

    } catch (err) {
      console.error('Error saving food item:', err)
      setError('Failed to save product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleModalCancel = () => {
    setShowModal(false)
    setAiResult(null)
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
            loading={recognizing}
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

      {/* Confirmation Modal */}
      {aiResult && (
        <ConfirmationModal
          isOpen={showModal}
          imageUrl={capturedImage?.dataUrl || ''}
          productName={aiResult.product_name}
          expiryDate={aiResult.expiry_date}
          confidence={aiResult.confidence}
          notes={aiResult.notes}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          loading={saving}
        />
      )}

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
