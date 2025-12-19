'use client'

import Image from 'next/image'
import { CARD_STYLES } from '@/styles/themes'

interface ImagePreviewProps {
  src: string
  alt: string
  onRemove: () => void
  isLoading?: boolean
}

export function ImagePreview({
  src,
  alt,
  onRemove,
  isLoading = false,
}: ImagePreviewProps) {
  return (
    <div className={CARD_STYLES.default}>
      <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden mb-4">
        {/* Image container */}
        <div className="relative w-full h-96">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Remove button overlay */}
        <button
          onClick={onRemove}
          disabled={isLoading}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          aria-label="移除照片"
          type="button"
        >
          ✕
        </button>
      </div>

      {/* Image info */}
      <div className="text-sm text-gray-600">
        <p>✓ 照片已選擇，等待 AI 辨識...</p>
      </div>
    </div>
  )
}
