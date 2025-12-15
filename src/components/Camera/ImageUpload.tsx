'use client'

/**
 * ImageUpload Component
 *
 * Handles image file selection and camera capture.
 * - Supports both file upload and camera capture
 * - Validates image format and size
 * - Automatically compresses large images
 *
 * Usage:
 *   <ImageUpload onImageSelected={handleImage} onError={handleError} />
 */

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

    // Reset input value to allow selecting the same file again
    event.target.value = ''

    try {
      // Validate image
      const { isValid, error } = validateImage(file)
      if (!isValid) {
        onError?.(error || '!HÑGîH')
        return
      }

      // Compress image if needed
      const compressedBlob = await compressImage(file)

      // Convert to File object
      const compressedFile = new File(
        [compressedBlob],
        file.name,
        { type: getMimeType(compressedBlob) }
      )

      // Create data URL for preview
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
        onError?.('Ä÷G1WÀÕf')
      }
      reader.readAsDataURL(compressedBlob)
    } catch (error) {
      console.error('Error processing image:', error)
      onError?.(
        error instanceof Error
          ? error.message
          : 'UGB|/§'
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
        aria-label="x«Õﬂ¡gG"
      />

      {/* Trigger element (button or custom children) */}
      {children ? (
        <div onClick={handleButtonClick} role="button" tabIndex={0}>
          {children}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled}
          className="
            px-6 py-3
            bg-blue-600 hover:bg-blue-700
            text-white font-semibold
            rounded-lg shadow-md
            transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          x«gG
        </button>
      )}
    </div>
  )
}
