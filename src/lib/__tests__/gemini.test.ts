/**
 * Gemini Utilities Tests
 */

import {
  parseGeminiResponse,
  isValidGeminiResponse,
  extractJSON,
  sanitizeProductName,
  getConfidenceColor,
  getConfidenceLabel,
  formatConfidence,
} from '../gemini'
import type { GeminiResponse } from '@/types'

describe('Gemini Utilities', () => {
  describe('parseGeminiResponse', () => {
    it('should parse valid JSON response', () => {
      const input = {
        product_name: '義美小泡芙',
        expiry_date: '2025-12-25',
        confidence: 85,
      }

      const result = parseGeminiResponse(input)

      expect(result.product_name).toBe('義美小泡芙')
      expect(result.expiry_date).toBe('2025-12-25')
      expect(result.confidence).toBe(85)
    })

    it('should parse JSON string response', () => {
      const input = '{"product_name":"test","expiry_date":"2025-01-01","confidence":75}'

      const result = parseGeminiResponse(input)

      expect(result.product_name).toBe('test')
      expect(result.expiry_date).toBe('2025-01-01')
      expect(result.confidence).toBe(75)
    })

    it('should clamp confidence to 0-100', () => {
      const tooHigh = parseGeminiResponse({
        product_name: 'test',
        expiry_date: '2025-01-01',
        confidence: 150,
      })
      expect(tooHigh.confidence).toBe(100)

      const tooLow = parseGeminiResponse({
        product_name: 'test',
        expiry_date: '2025-01-01',
        confidence: -50,
      })
      expect(tooLow.confidence).toBe(0)
    })

    it('should return error response for invalid input', () => {
      const result = parseGeminiResponse('not json')

      expect(result.product_name).toBe('')
      expect(result.expiry_date).toBe('')
      expect(result.confidence).toBe(0)
    })
  })

  describe('isValidGeminiResponse', () => {
    it('should validate correct response', () => {
      const response: GeminiResponse = {
        product_name: 'Test',
        expiry_date: '2025-01-01',
        confidence: 75,
      }

      expect(isValidGeminiResponse(response)).toBe(true)
    })

    it('should accept empty response (recognition failed)', () => {
      const response: GeminiResponse = {
        product_name: '',
        expiry_date: '',
        confidence: 0,
      }

      expect(isValidGeminiResponse(response)).toBe(true)
    })

    it('should reject response with product name but no date', () => {
      const response: GeminiResponse = {
        product_name: 'Test',
        expiry_date: '',
        confidence: 75,
      }

      expect(isValidGeminiResponse(response)).toBe(false)
    })

    it('should reject response with invalid date format', () => {
      const response: GeminiResponse = {
        product_name: 'Test',
        expiry_date: '2025/01/01',
        confidence: 75,
      }

      expect(isValidGeminiResponse(response)).toBe(false)
    })

    it('should reject confidence outside 0-100', () => {
      const response: GeminiResponse = {
        product_name: 'Test',
        expiry_date: '2025-01-01',
        confidence: 150,
      }

      expect(isValidGeminiResponse(response)).toBe(false)
    })
  })

  describe('extractJSON', () => {
    it('should extract valid JSON', () => {
      const json = { test: 'value' }
      const result = extractJSON(JSON.stringify(json))

      expect(result).toEqual(json)
    })

    it('should extract JSON from text', () => {
      const text = 'Some text {"name":"test"} more text'
      const result = extractJSON(text)

      expect(result).toEqual({ name: 'test' })
    })

    it('should return null for invalid JSON', () => {
      const result = extractJSON('no json here')
      expect(result).toBeNull()
    })
  })

  describe('sanitizeProductName', () => {
    it('should trim whitespace', () => {
      const result = sanitizeProductName('  test  ')
      expect(result).toBe('test')
    })

    it('should normalize multiple spaces', () => {
      const result = sanitizeProductName('test   product   name')
      expect(result).toBe('test product name')
    })

    it('should limit length to 100 characters', () => {
      const longName = 'a'.repeat(150)
      const result = sanitizeProductName(longName)
      expect(result.length).toBe(100)
    })
  })

  describe('Confidence utilities', () => {
    it('should return correct color for confidence', () => {
      expect(getConfidenceColor(90)).toBe('green')
      expect(getConfidenceColor(70)).toBe('yellow')
      expect(getConfidenceColor(50)).toBe('orange')
      expect(getConfidenceColor(30)).toBe('red')
    })

    it('should return correct label for confidence', () => {
      expect(getConfidenceLabel(90)).toBe('非常可信')
      expect(getConfidenceLabel(70)).toBe('可信')
      expect(getConfidenceLabel(50)).toBe('低信任')
      expect(getConfidenceLabel(30)).toBe('不可信')
    })

    it('should format confidence with percentage and label', () => {
      const result = formatConfidence(85)
      expect(result).toMatch(/85% - /)
      expect(result).toContain('非常可信')
    })
  })
})
