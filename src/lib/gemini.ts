/**
 * Gemini Vision API Utilities
 *
 * Provides helper functions and prompts for food recognition
 * via Google Gemini Vision API.
 */

import type { GeminiResponse } from '@/types'

/**
 * System prompt for food recognition
 * Instructs Gemini to extract product name, expiry date, and confidence
 */
export const FOOD_RECOGNITION_PROMPT = `你是一個專業的食品識別助手。
根據上傳的食品包裝照片，提取以下信息：

1. 產品名稱 (例如: "義美小泡芙")
2. 有效期限 (必須是 YYYY-MM-DD 格式，例如 2025-12-25)
   - 如果只看到月份和年份，假設為該月最後一天
   - 如果看到「2025年12月」，轉換為 2025-12-31
   - 如果看到「有效期至 20251225」，轉換為 2025-12-25
3. 信心度 (0-100，表示你對識別結果的確定程度)

回應必須是有效的 JSON 格式，不要包含任何其他文字：
{
  "product_name": "...",
  "expiry_date": "YYYY-MM-DD",
  "confidence": 95,
  "notes": "任何額外信息或警告"
}

如果無法識別，回應：
{
  "product_name": "",
  "expiry_date": "",
  "confidence": 0,
  "notes": "無法識別圖片中的食品信息"
}`

/**
 * Parse and validate Gemini API response
 * Ensures the response has valid format and values
 */
export function parseGeminiResponse(response: unknown): GeminiResponse {
  // Handle string response
  if (typeof response === 'string') {
    try {
      response = JSON.parse(response)
    } catch {
      return {
        product_name: '',
        expiry_date: '',
        confidence: 0,
        notes: 'Failed to parse API response',
      }
    }
  }

  // Type check
  if (!response || typeof response !== 'object') {
    return {
      product_name: '',
      expiry_date: '',
      confidence: 0,
      notes: 'Invalid response format',
    }
  }

  const obj = response as Record<string, unknown>

  // Extract and validate fields
  const productName = String(obj.product_name || '').trim()
  const expiryDate = String(obj.expiry_date || '').trim()
  let confidence = Number(obj.confidence || 0)

  // Validate confidence is within 0-100
  if (confidence < 0) confidence = 0
  if (confidence > 100) confidence = 100

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (expiryDate && !dateRegex.test(expiryDate)) {
    return {
      product_name: '',
      expiry_date: '',
      confidence: 0,
      notes: 'Invalid date format. Expected YYYY-MM-DD',
    }
  }

  return {
    product_name: productName,
    expiry_date: expiryDate,
    confidence: confidence,
    notes: String(obj.notes || '').trim() || undefined,
  }
}

/**
 * Validate Gemini response has required fields
 */
export function isValidGeminiResponse(response: GeminiResponse): boolean {
  // Must have product name or be completely empty (recognition failed)
  if (!response.product_name && !response.expiry_date) {
    return true // OK: explicit failure
  }

  // If has product name, must have expiry date
  if (response.product_name && !response.expiry_date) {
    return false
  }

  // If has expiry date, must have product name
  if (!response.product_name && response.expiry_date) {
    return false
  }

  // Date format must be YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (response.expiry_date && !dateRegex.test(response.expiry_date)) {
    return false
  }

  // Confidence must be 0-100
  if (response.confidence < 0 || response.confidence > 100) {
    return false
  }

  return true
}

/**
 * Extract JSON from text response
 * Handles cases where Gemini returns additional text around JSON
 */
export function extractJSON(text: string): Record<string, unknown> | null {
  try {
    // Try direct parse first
    return JSON.parse(text)
  } catch {
    // Try to extract JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        return null
      }
    }
    return null
  }
}

/**
 * Format API error message
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Unknown error occurred'
}

/**
 * Check if API key is configured
 */
export function hasGeminiApiKey(): boolean {
  return !!(typeof process !== 'undefined' && process.env?.GEMINI_API_KEY)
}

/**
 * Sanitize product name for safety
 */
export function sanitizeProductName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 100) // Limit length
}

/**
 * Get confidence color based on score
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'green'
  if (confidence >= 60) return 'yellow'
  if (confidence >= 40) return 'orange'
  return 'red'
}

/**
 * Get confidence label based on score
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return '非常可信'
  if (confidence >= 60) return '可信'
  if (confidence >= 40) return '低信任'
  return '不可信'
}

/**
 * Format confidence display
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence)}% - ${getConfidenceLabel(confidence)}`
}
