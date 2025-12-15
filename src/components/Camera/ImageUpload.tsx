'use client'

import { useRef, ChangeEvent } from 'react'
import { validateImage, compressImage, getMimeType } from '@/lib/image'
import { CaptureResult } from '@/types'

interface ImageUploadProps {
  onImageSelected: (result: CaptureResult) => void
  onError?: (error: string) => void
  disabled?: boolean
  children?: React.ReactNode
}

export default function ImageUpload({
  onImageSelected,
  onError,
  disabled = false,
  children,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    event.target.value = ''

    try {
      const { isValid, error } = validateImage(file)
      if (!isValid) {
        onError?.(error || 'Invalid image file')
        return
      }

      const compressedBlob = await compressImage(file)

      const compressedFile = new File(
        [compressedBlob],
        file.name,
        { type: getMimeType(compressedBlob) }
      )

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        if (dataUrl) {
          onImageSelected({
            dataUrl,
            file: compressedFile,
          })
        }
      }
      reader.onerror = () => {
        onError?.('Failed to read image, please try again')
      }
      reader.readAsDataURL(compressedBlob)
    } catch (error) {
      console.error('Error processing image:', error)
      onError?.(
        error instanceof Error
          ? error.message
          : 'Error processing image'
      )
    }
  }

  const handleButtonClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
        aria-label="Select or capture food photo"
      />

      {children ? (
        <div onClick={handleButtonClick} role="button" tabIndex={0}>
          {children}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Select Photo
        </button>
      )}
    </div>
  )
}
