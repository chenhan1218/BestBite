const MAX_IMAGE_SIZE_MB = 2
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
const COMPRESSION_QUALITY = 0.8
const MAX_DIMENSION = 1920

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const

export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number]

export function validateImage(file: File): {
  isValid: boolean
  error?: string
} {
  if (!file) {
    return { isValid: false, error: 'No file selected' }
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as SupportedImageType)) {
    return {
      isValid: false,
      error: `Unsupported format. Please use JPEG, PNG or WebP.`,
    }
  }

  const maxUploadSize = 10 * 1024 * 1024
  if (file.size > maxUploadSize) {
    return {
      isValid: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please select image under 10MB.`,
    }
  }

  return { isValid: true }
}

export async function compressImage(
  file: File,
  maxSizeMB: number = MAX_IMAGE_SIZE_MB,
  quality: number = COMPRESSION_QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size <= maxBytes) {
      resolve(file)
      return
    }

    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error('Failed to read image'))
    }

    reader.onload = (e) => {
      const img = new Image()

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.onload = () => {
        try {
          let { width, height } = img

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
            width = Math.floor(width * ratio)
            height = Math.floor(height * ratio)
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Cannot create canvas'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }

              console.log(
                `Image compressed: ${(file.size / 1024).toFixed(0)}KB -> ${(blob.size / 1024).toFixed(0)}KB`
              )

              resolve(blob)
            },
            'image/jpeg',
            quality
          )
        } catch (error) {
          reject(new Error('Error processing image'))
        }
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}

export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]

      if (!base64) {
        reject(new Error('Failed to convert to Base64'))
        return
      }

      resolve(base64)
    }

    reader.readAsDataURL(file)
  })
}

export async function fileToDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.onload = () => {
      resolve(reader.result as string)
    }

    reader.readAsDataURL(file)
  })
}

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

export function getMimeType(file: File | Blob): string {
  return file.type || 'image/jpeg'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
