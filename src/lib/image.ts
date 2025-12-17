/**
 * Image Processing Utilities
 *
 * Handles image compression, preview generation, and Base64 conversion
 * for use with Gemini Vision API and UI display.
 */

/**
 * Compress image file to reduce size while maintaining quality
 * Returns a new File object with compressed data
 */
export async function compressImage(file: File, maxSizeKB: number = 1500): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()

      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Calculate dimensions to maintain aspect ratio
        let width = img.width
        let height = img.height
        const maxDimension = 1200 // Max width/height

        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        // Compress to target file size
        let quality = 0.9
        let compressedBlob: Blob | null = null

        const tryCompress = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'))
                return
              }

              const fileSizeKB = blob.size / 1024
              if (fileSizeKB <= maxSizeKB || q <= 0.1) {
                // Size is acceptable or quality is too low
                compressedBlob = blob
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: file.lastModified,
                })
                resolve(compressedFile)
              } else {
                // Quality too high, reduce and retry
                tryCompress(q - 0.1)
              }
            },
            'image/jpeg',
            q
          )
        }

        tryCompress(quality)
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = event.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Convert File to Base64 string for API transmission
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string
      // Extract base64 part (remove data:image/...;base64, prefix)
      const base64 = result.split(',')[1]
      resolve(base64)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Generate a preview image as data URL
 * Used for displaying image before confirmation
 */
export async function getImagePreview(file: File, maxWidth: number = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()

      img.onload = () => {
        // Create canvas for preview
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Calculate dimensions
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve(dataUrl)
      }

      img.onerror = () => {
        reject(new Error('Failed to load image for preview'))
      }

      img.src = event.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file for preview'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file
 * Checks size, format, and dimensions
 */
export interface ImageValidationResult {
  valid: boolean
  error?: string
  width?: number
  height?: number
  sizeKB?: number
}

export async function validateImage(file: File): Promise<ImageValidationResult> {
  // Check file size (must be < 20MB for safety)
  const maxFileSizeKB = 20000
  const fileSizeKB = file.size / 1024

  if (fileSizeKB > maxFileSizeKB) {
    return {
      valid: false,
      error: `File size ${Math.round(fileSizeKB)}KB exceeds maximum ${maxFileSizeKB}KB`,
      sizeKB: fileSizeKB,
    }
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not supported. Use JPEG, PNG, or WebP.`,
    }
  }

  // Check image dimensions
  return new Promise((resolve) => {
    const img = new Image()

    img.onload = () => {
      const minDimension = 100
      const maxDimension = 4000

      if (img.width < minDimension || img.height < minDimension) {
        resolve({
          valid: false,
          error: `Image too small. Minimum size: ${minDimension}x${minDimension}px`,
          width: img.width,
          height: img.height,
          sizeKB: fileSizeKB,
        })
      } else if (img.width > maxDimension || img.height > maxDimension) {
        resolve({
          valid: false,
          error: `Image too large. Maximum size: ${maxDimension}x${maxDimension}px`,
          width: img.width,
          height: img.height,
          sizeKB: fileSizeKB,
        })
      } else {
        resolve({
          valid: true,
          width: img.width,
          height: img.height,
          sizeKB: fileSizeKB,
        })
      }
    }

    img.onerror = () => {
      resolve({
        valid: false,
        error: 'Failed to load image file',
        sizeKB: fileSizeKB,
      })
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Get image MIME type from file
 */
export function getImageMimeType(file: File): string {
  return file.type || 'image/jpeg'
}

/**
 * Resize image to specific dimensions
 */
export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        canvas.width = targetWidth
        canvas.height = targetHeight
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'))
              return
            }

            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: file.lastModified,
            })
            resolve(resizedFile)
          },
          file.type,
          0.85
        )
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = event.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}
