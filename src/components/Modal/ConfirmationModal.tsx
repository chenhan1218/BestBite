'use client'

/**
 * ConfirmationModal Component
 *
 * Displays AI recognition results and allows user to edit before saving.
 * - Shows product name (editable)
 * - Shows expiry date (editable)
 * - Shows confidence score
 * - Shows original image
 *
 * Usage:
 *   <ConfirmationModal
 *     isOpen={true}
 *     imageUrl={url}
 *     productName="Product"
 *     expiryDate="2025-12-31"
 *     confidence={0.95}
 *     onConfirm={handleConfirm}
 *     onCancel={handleCancel}
 *   />
 */

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ConfirmationModalProps {
  isOpen: boolean
  imageUrl: string
  productName: string
  expiryDate: string
  confidence: number
  notes?: string
  onConfirm: (productName: string, expiryDate: string) => void
  onCancel: () => void
  loading?: boolean
}

export default function ConfirmationModal({
  isOpen,
  imageUrl,
  productName: initialProductName,
  expiryDate: initialExpiryDate,
  confidence,
  notes,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationModalProps) {
  const [productName, setProductName] = useState(initialProductName)
  const [expiryDate, setExpiryDate] = useState(initialExpiryDate)

  // Update state when props change
  useEffect(() => {
    setProductName(initialProductName)
    setExpiryDate(initialExpiryDate)
  }, [initialProductName, initialExpiryDate])

  const handleConfirm = () => {
    if (!productName.trim()) {
      alert('Please enter product name')
      return
    }

    if (!expiryDate) {
      alert('Please select expiry date')
      return
    }

    onConfirm(productName.trim(), expiryDate)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">Confirm Product Information</h2>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none disabled:opacity-50"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Preview */}
          <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt="Product image"
              fill
              className="object-contain"
            />
          </div>

          {/* Confidence Score */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">AI Confidence:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  confidence >= 0.7 ? 'bg-green-500' : confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold">{(confidence * 100).toFixed(0)}%</span>
          </div>

          {/* Notes */}
          {notes && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{notes}</p>
            </div>
          )}

          {/* Product Name Input */}
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              id="productName"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 text-lg"
              placeholder="Enter product name"
            />
          </div>

          {/* Expiry Date Input */}
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 text-lg"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4 p-6 border-t bg-gray-50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
