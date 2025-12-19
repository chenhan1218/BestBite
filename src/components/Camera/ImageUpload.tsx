'use client'

import { useRef } from 'react'
import { validateImage } from '@/lib/image'

interface ImageUploadProps {
  onImageSelect: (file: File) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function ImageUpload({
  onImageSelect,
  isLoading = false,
  error = null,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return

    const validation = await validateImage(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    await onImageSelect(file)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        await handleFileChange(file)
      } catch (err) {
        console.error('Image validation error:', err)
      }
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const triggerCamera = () => {
    cameraInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        disabled={isLoading}
        aria-hidden="true"
        className="hidden"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        disabled={isLoading}
        aria-hidden="true"
        className="hidden"
      />

      {/* Upload buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={triggerCamera}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          type="button"
        >
          {isLoading ? '上傳中...' : '📷 拍攝照片'}
        </button>

        <button
          onClick={triggerFileUpload}
          disabled={isLoading}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          type="button"
        >
          {isLoading ? '上傳中...' : '📁 選擇相片'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold">錯誤</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* File requirements */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>✓ 支援 JPEG 和 PNG 格式</p>
        <p>✓ 檔案大小 &lt; 2MB</p>
        <p>✓ 建議解像度 1280×720 以上</p>
      </div>
    </div>
  )
}
