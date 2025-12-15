/**
 * Google Gemini API Integration
 *
 * This module provides utilities for food recognition using Gemini Vision API.
 *
 * Functions:
 * - recognizeFood: Analyze food packaging image and extract product info
 * - formatGeminiResponse: Parse and validate Gemini API response
 *
 * Usage:
 *   import { recognizeFood } from '@/lib/gemini'
 *   const result = await recognizeFood(imageBase64, mimeType)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeminiResponse } from '@/types'

// Initialize Gemini API
let genAI: GoogleGenerativeAI | null = null

function initGemini(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set. Please add it to your .env.local file.'
      )
    }
    
    genAI = new GoogleGenerativeAI(apiKey)
    console.log('Gemini API initialized successfully')
  }
  
  return genAI
}

/**
 * Prompt template for Gemini Vision API
 * Instructs the AI to extract product name and expiry date from food packaging
 */
const FOOD_RECOGNITION_PROMPT = `你是一個專業的食品識別助手。
根據上傳的食品包裝照片，提取以下信息：

1. **產品名稱** (例如: "義美小泡芙", "可口可樂", "統一麵包")
2. **有效期限** (必須是 YYYY-MM-DD 格式)
   - 如果看到 "2025/12/25" 或 "2025.12.25"，轉換為 "2025-12-25"
   - 如果只看到 "12月25日"，假設年份為當年或次年（根據當前月份判斷）
   - 如果只看到年月（例如 "2025年12月"），假設為該月最後一天 "2025-12-31"
   - 如果有多個日期（製造日期、有效期限），只提取有效期限
3. **信心度** (0-100，表示你對識別結果的確定程度)
   - 90-100: 非常確定（清晰可見的文字）
   - 70-89: 較確定（稍微模糊但可辨認）
   - 50-69: 不太確定（文字不清或部分遮擋）
   - 0-49: 無法確定（圖片模糊或無相關信息）

**回應格式** - 必須是有效的 JSON：

{
  "product_name": "產品名稱",
  "expiry_date": "YYYY-MM-DD",
  "confidence": 95,
  "notes": "任何額外信息或警告（可選）"
}

**特殊情況處理：**

如果無法識別圖片中的食品信息，回應：
{
  "product_name": "",
  "expiry_date": "",
  "confidence": 0,
  "notes": "無法識別圖片中的食品信息。請確保照片清晰且包含產品包裝。"
}

如果圖片中沒有食品包裝，回應：
{
  "product_name": "",
  "expiry_date": "",
  "confidence": 0,
  "notes": "這張圖片似乎不是食品包裝照片。"
}

現在請分析這張圖片並提取食品信息。`

/**
 * Recognize food product information from an image using Gemini Vision API
 *
 * @param imageBase64 - Base64 encoded image string (without data URI prefix)
 * @param mimeType - Image MIME type (e.g., 'image/jpeg', 'image/png')
 * @returns Promise<GeminiResponse> - Parsed product information
 *
 * @throws Error if API call fails or response is invalid
 *
 * @example
 * const result = await recognizeFood(base64Image, 'image/jpeg')
 * console.log(result.product_name) // "義美小泡芙"
 * console.log(result.expiry_date)  // "2025-12-25"
 * console.log(result.confidence)   // 95
 */
export async function recognizeFood(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<GeminiResponse> {
  try {
    const ai = initGemini()
    
    // Use Gemini Pro Vision model
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    // Prepare image data
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    }
    
    // Generate content
    const result = await model.generateContent([
      FOOD_RECOGNITION_PROMPT,
      imagePart,
    ])
    
    const response = await result.response
    const text = response.text()
    
    console.log('Gemini API raw response:', text)
    
    // Parse and validate response
    return formatGeminiResponse(text)
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    
    if (error instanceof Error) {
      throw new Error(`Gemini API 調用失敗: ${error.message}`)
    }
    
    throw new Error('Gemini API 調用失敗: 未知錯誤')
  }
}

/**
 * Parse and validate Gemini API response
 *
 * @param rawResponse - Raw text response from Gemini API
 * @returns GeminiResponse - Validated and formatted response
 *
 * @throws Error if response is not valid JSON or missing required fields
 */
export function formatGeminiResponse(rawResponse: string): GeminiResponse {
  try {
    // Remove markdown code blocks if present
    let cleanedResponse = rawResponse.trim()
    
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '')
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\s*/g, '')
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/\s*```$/g, '')
    }
    
    // Parse JSON
    const parsed = JSON.parse(cleanedResponse)
    
    // Validate required fields
    if (typeof parsed.product_name !== 'string') {
      throw new Error('Missing or invalid product_name')
    }
    
    if (typeof parsed.expiry_date !== 'string') {
      throw new Error('Missing or invalid expiry_date')
    }
    
    if (typeof parsed.confidence !== 'number') {
      throw new Error('Missing or invalid confidence')
    }
    
    // Validate date format (YYYY-MM-DD)
    if (parsed.expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(parsed.expiry_date)) {
      console.warn(
        `Invalid date format: ${parsed.expiry_date}. Expected YYYY-MM-DD.`
      )
    }
    
    // Normalize confidence to 0-1 range if it's 0-100
    let normalizedConfidence = parsed.confidence
    if (normalizedConfidence > 1) {
      normalizedConfidence = normalizedConfidence / 100
    }
    
    return {
      product_name: parsed.product_name,
      expiry_date: parsed.expiry_date,
      confidence: normalizedConfidence,
      notes: parsed.notes || undefined,
    }
  } catch (error) {
    console.error('Error parsing Gemini response:', error)
    console.error('Raw response:', rawResponse)
    
    throw new Error(
      'Gemini API 回應格式錯誤。請稍後再試或使用其他圖片。'
    )
  }
}

/**
 * Validate if a date string is in YYYY-MM-DD format and is a valid date
 *
 * @param dateString - Date string to validate
 * @returns boolean - True if valid, false otherwise
 */
export function isValidDateFormat(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false
  }
  
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}
