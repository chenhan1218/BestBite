'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ImagePreviewProps {
  imageUrl: string
  onRetry?: () => void
  onConfirm?: () => void
  onCancel?: () => void
  loading?: boolean
  showActions?: boolean
}

export default function ImagePreview({
  imageUrl,
  onRetry,
  onConfirm,
  onCancel,
  loading = false,
  showActions = true,
}: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-md">
        {!imageError ? (
          <Image
            src={imageUrl}
            alt="Food package photo"
            fill
            className="object-contain"
            onError={() => setImageError(true)}
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <span className="text-6xl mb-4 block">=¼</span>
              <p className="text-lg">Image load failed</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg font-semibold">AI recognizing...</p>
              <p className="text-sm mt-2">Please wait</p>
            </div>
          </div>
        )}
      </div>

      {showActions && !loading && (
        <div className="flex gap-4 mt-6">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg shadow-md transition-colors duration-200"
            >
              Cancel
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
            >
              Retake
            </button>
          )}

          {onConfirm && (
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
            >
              Recognize
            </button>
          )}
        </div>
      )}

      {!loading && (
        <p className="text-center text-sm text-gray-500 mt-4">
          {showActions
            ? 'Ensure product name and expiry date are clearly visible'
            : 'Photo preview'}
        </p>
      )}
    </div>
  )
}
