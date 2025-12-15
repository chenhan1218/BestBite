/**
 * Image Processing Utilities
 *
 * Provides functions for image compression, validation, and format conversion.
 *
 * Functions:
 * - compressImage: Compress image to meet size requirements
 * - fileToBase64: Convert File/Blob to Base64 string
 * - validateImage: Validate image format and size
 * - dataURLToBlob: Convert data URL to Blob
 *
 * Usage:
 *   import { compressImage, fileToBase64 } from '@/lib/image'
 */

const MAX_IMAGE_SIZE_MB = 2
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
const COMPRESSION_QUALITY = 0.8
const MAX_DIMENSION = 1920

/**
 * Supported image MIME types
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const

export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number]

/**
 * Validate if a file is a supported image format and within size limits
 *
 * @param file - The file to validate
 * @returns Object with isValid boolean and optional error message
 *
 * @example
 * const { isValid, error } = validateImage(file)
 * if (!isValid) {
 *   console.error(error)
 * }
 */
export function validateImage(file: File): {
  isValid: boolean
  error?: string
} {
  // Check if file exists
  if (!file) {
    return { isValid: false, error: '*xÇ”H' }
  }

  // Check file type
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as SupportedImageType)) {
    return {
      isValid: false,
      error: `/ô„G<Ë( JPEGPNG  WebP <`,
    }
  }

  // Check file size (10MB hard limit before compression)
  const maxUploadSize = 10 * 1024 * 1024
  if (file.size > maxUploadSize) {
    return {
      isValid: false,
      error: `G”HN'${(file.size / 1024 / 1024).toFixed(1)}MB	ËxÇ¼ 10MB „G`,
    }
  }

  return { isValid: true }
}

/**
 * Compress an image to meet size requirements (< 2MB)
 *
 * @param file - The image file to compress
 * @param maxSizeMB - Maximum size in MB (default: 2)
 * @param quality - Compression quality 0-1 (default: 0.8)
 * @returns Promise<Blob> - Compressed image as Blob
 *
 * @example
 * const compressedBlob = await compressImage(file)
 * const url = await uploadImage(compressedBlob, path)
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = MAX_IMAGE_SIZE_MB,
  quality: number = COMPRESSION_QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If file is already small enough, return as-is
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size <= maxBytes) {
      resolve(file)
      return
    }

    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error('€ÖG1W'))
    }

    reader.onload = (e) => {
      const img = new Image()

      img.onerror = () => {
        reject(new Error('	eG1W'))
      }

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img

          // Resize if image is too large
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
            width = Math.floor(width * ratio)
            height = Math.floor(height * ratio)
          }

          // Create canvas and draw image
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('!ÕúËk'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Ó.G1W'))
                return
              }

              console.log(
                `Image compressed: ${(file.size / 1024).toFixed(0)}KB ’ ${(blob.size / 1024).toFixed(0)}KB`
              )

              resolve(blob)
            },
            'image/jpeg',
            quality
          )
        } catch (error) {
          reject(new Error('UGB|/¤'))
        }
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Convert a File or Blob to Base64 string
 *
 * @param file - The file to convert
 * @returns Promise<string> - Base64 encoded string (without data URI prefix)
 *
 * @example
 * const base64 = await fileToBase64(file)
 * // Returns: "/9j/4AAQSkZJRgABAQAA..." (without "data:image/jpeg;base64," prefix)
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error('€Ö”H1W'))
    }

    reader.onload = () => {
      const result = reader.result as string

      // Remove data URI prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1]

      if (!base64) {
        reject(new Error('IÛ Base64 1W'))
        return
      }

      resolve(base64)
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Convert a File or Blob to Base64 data URL (with prefix)
 *
 * @param file - The file to convert
 * @returns Promise<string> - Base64 data URL
 *
 * @example
 * const dataURL = await fileToDataURL(file)
 * // Returns: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
 */
export async function fileToDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error('€Ö”H1W'))
    }

    reader.onload = () => {
      resolve(reader.result as string)
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Convert a data URL to Blob
 *
 * @param dataURL - Data URL string
 * @returns Blob - Converted blob
 *
 * @example
 * const blob = dataURLToBlob('data:image/jpeg;base64,...')
 */
export function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(parts[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new Blob([u8arr], { type: mime })
}

/**
 * Get the MIME type from a file
 *
 * @param file - The file to check
 * @returns string - MIME type
 */
export function getMimeType(file: File | Blob): string {
  return file.type || 'image/jpeg'
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns string - Formatted size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
