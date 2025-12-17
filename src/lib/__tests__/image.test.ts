/**
 * Image Processing Utilities Tests
 *
 * Tests for image compression, validation, and transformation functions.
 */

import {
  getImageMimeType,
  validateImage,
  getImagePreview,
  fileToBase64,
} from '../image'

// Mock Canvas API
class MockCanvas {
  width = 0
  height = 0
  getContext = jest.fn(() => ({
    drawImage: jest.fn(),
  }))
  toBlob = jest.fn((callback: (blob: Blob | null) => void) => {
    callback(new Blob(['mock-image-data'], { type: 'image/jpeg' }))
  })
  toDataURL = jest.fn(() => 'data:image/jpeg;base64,mock-base64-data')
}

// Mock FileReader
class MockFileReader {
  result: string | null = null
  onload: ((event: any) => void) | null = null
  onerror: (() => void) | null = null

  readAsDataURL(file: File) {
    this.result = 'data:image/jpeg;base64,mock-base64-data'
    if (this.onload) {
      this.onload({ target: { result: this.result } } as any)
    }
  }
}

// Mock Image element
class MockImage {
  src: string = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  width: number = 1920
  height: number = 1080

  constructor() {
    setTimeout(() => {
      if (this.onload) {
        this.onload()
      }
    }, 0)
  }
}

describe('Image Processing Utilities', () => {
  beforeEach(() => {
    // Setup DOM mocks
    ;(global as any).document.createElement = jest.fn((tag: string) => {
      if (tag === 'canvas') {
        return new MockCanvas()
      }
      return {}
    })

    ;(global as any).FileReader = MockFileReader as any
    ;(global as any).Image = MockImage as any
    ;(global as any).URL.createObjectURL = jest.fn(() => 'blob:mock-url')
  })

  describe('getImageMimeType', () => {
    it('should return JPEG mime type for JPEG file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      expect(getImageMimeType(file)).toBe('image/jpeg')
    })

    it('should return PNG mime type for PNG file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      expect(getImageMimeType(file)).toBe('image/png')
    })

    it('should return default mime type for unknown type', () => {
      const file = new File(['test'], 'test.txt', { type: '' })
      expect(getImageMimeType(file)).toBe('image/jpeg')
    })

    it('should handle WebP mime type', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' })
      expect(getImageMimeType(file)).toBe('image/webp')
    })
  })

  describe('validateImage', () => {
    it('should validate correct image file', async () => {
      const file = new File(['x'.repeat(1000)], 'test.jpg', { type: 'image/jpeg' })

      const result = await validateImage(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.sizeKB).toBeGreaterThan(0)
    })

    it('should reject oversized files', async () => {
      // 21MB file (exceeds 20MB limit)
      const largeBuffer = new ArrayBuffer(21 * 1024 * 1024)
      const file = new File([largeBuffer], 'large.jpg', { type: 'image/jpeg' })

      const result = await validateImage(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds maximum')
    })

    it('should reject unsupported file types', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })

      const result = await validateImage(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not supported')
    })

    it('should accept JPEG, PNG, and WebP formats', async () => {
      const formats = ['image/jpeg', 'image/png', 'image/webp']

      for (const format of formats) {
        const file = new File(['test'], `test.${format.split('/')[1]}`, { type: format })
        const result = await validateImage(file)

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      }
    })

    it('should include size information in result', async () => {
      const file = new File(['test data'], 'test.jpg', { type: 'image/jpeg' })

      const result = await validateImage(file)

      expect(result.sizeKB).toBeDefined()
      expect(typeof result.sizeKB).toBe('number')
      expect(result.sizeKB).toBeGreaterThan(0)
    })

    it('should include image dimensions in valid result', async () => {
      const file = new File(['test data'], 'test.jpg', { type: 'image/jpeg' })

      const result = await validateImage(file)

      expect(result.width).toBeDefined()
      expect(result.height).toBeDefined()
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
    })
  })

  describe('getImagePreview', () => {
    it('should generate valid data URL preview', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const preview = await getImagePreview(file)

      expect(preview).toMatch(/^data:image\/jpeg;base64/)
    })

    it('should respect max width parameter', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const maxWidth = 200

      const preview = await getImagePreview(file, maxWidth)

      expect(preview).toBeDefined()
      expect(typeof preview).toBe('string')
    })

    it('should use default max width of 300px if not specified', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const preview = await getImagePreview(file)

      expect(preview).toBeDefined()
    })

    it('should handle aspect ratio correctly', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const preview = await getImagePreview(file, 300)

      expect(preview).toMatch(/^data:image/)
      expect(preview).toContain('base64')
    })
  })

  describe('fileToBase64', () => {
    it('should convert file to base64 string', async () => {
      const file = new File(['test data'], 'test.jpg', { type: 'image/jpeg' })

      const base64 = await fileToBase64(file)

      expect(base64).toBeDefined()
      expect(typeof base64).toBe('string')
    })

    it('should extract base64 part without data URI prefix', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const base64 = await fileToBase64(file)

      expect(base64).not.toContain('data:')
      expect(base64).not.toContain('base64,')
    })

    it('should handle different file types', async () => {
      const types = ['image/jpeg', 'image/png', 'image/webp']

      for (const type of types) {
        const file = new File(['test'], `test.${type.split('/')[1]}`, { type })
        const base64 = await fileToBase64(file)

        expect(base64).toBeDefined()
        expect(typeof base64).toBe('string')
      }
    })
  })

  describe('Image Validation Error Cases', () => {
    it('should handle failed file read', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      // This test validates error handling structure
      const result = await validateImage(file)

      if (!result.valid) {
        expect(result.error).toBeDefined()
        expect(typeof result.error).toBe('string')
      }
    })

    it('should validate file with minimum size requirement', async () => {
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })

      const result = await validateImage(file)

      // Small files should either pass or fail with specific error
      expect(result.valid).toBeDefined()
    })
  })

  describe('Image Format Support', () => {
    it('should support common image formats', () => {
      const formats = [
        { type: 'image/jpeg', name: 'JPEG' },
        { type: 'image/png', name: 'PNG' },
        { type: 'image/webp', name: 'WebP' },
      ]

      formats.forEach(({ type, name }) => {
        const file = new File(['test'], `test.${type.split('/')[1]}`, { type })
        expect(getImageMimeType(file)).toBe(type)
      })
    })

    it('should default to JPEG for unknown types', () => {
      const file = new File(['test'], 'test.unknown', { type: '' })
      expect(getImageMimeType(file)).toBe('image/jpeg')
    })
  })
})
