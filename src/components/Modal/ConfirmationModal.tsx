'use client'

import Image from 'next/image'
import { useState } from 'react'
import { BUTTON_STYLES } from '@/styles/themes'

interface ConfirmationModalProps {
  isOpen: boolean
  imageUrl: string
  productName: string
  expiryDate: string
  confidence: number
  onConfirm: (data: {
    product_name: string
    expiry_date: string
  }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  error?: string | null
}

export function ConfirmationModal({
  isOpen,
  imageUrl,
  productName: initialProductName,
  expiryDate: initialExpiryDate,
  confidence,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}: ConfirmationModalProps) {
  const [productName, setProductName] = useState(initialProductName)
  const [expiryDate, setExpiryDate] = useState(initialExpiryDate)

  if (!isOpen) return null

  const handleConfirm = async () => {
    await onConfirm({
      product_name: productName,
      expiry_date: expiryDate,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">確認食品資訊</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="關閉"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image and Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <div className="relative w-full h-64">
                <Image
                  src={imageUrl}
                  alt="Food item"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label
                  htmlFor="productName"
                  className="block text-lg font-semibold mb-2"
                >
                  產品名稱
                </label>
                <input
                  id="productName"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="請輸入產品名稱"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label
                  htmlFor="expiryDate"
                  className="block text-lg font-semibold mb-2"
                >
                  有效期限
                </label>
                <input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* Confidence */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  🤖 AI 確信度：
                  <span className="font-bold">{Math.round(confidence * 100)}%</span>
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-semibold">錯誤</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors"
              type="button"
            >
              取消
            </button>

            <button
              onClick={handleConfirm}
              disabled={isLoading || !productName.trim() || !expiryDate}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              type="button"
            >
              {isLoading ? '保存中...' : '確認並保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
