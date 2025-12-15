/**
 * BestBite Type Definitions
 *
 * Core TypeScript interfaces and types for the food inventory management system.
 */

// Food item status based on days until expiry
export type FoodStatus = 'red' | 'yellow' | 'green'

// Main food item interface
export interface FoodItem {
  id: string
  product_name: string
  expiry_date: string // Format: YYYY-MM-DD
  days_until_expiry: number
  status: FoodStatus
  image_url: string
  confidence: number // 0-1, AI recognition confidence score
  created_at: Date
  updated_at: Date
}

// Gemini AI API response interface
export interface GeminiResponse {
  product_name: string
  expiry_date: string // Format: YYYY-MM-DD
  confidence: number
  notes?: string // Optional AI-generated notes or warnings
}

// Request payload for Gemini API
export interface GeminiRequest {
  image_data: string // Base64 encoded image
}

// Firebase Firestore data structure (without auto-generated fields)
export interface FoodItemInput {
  product_name: string
  expiry_date: string
  image_url: string
  confidence: number
}

// Filter options for inventory display
export type FilterOption = 'all' | 'red' | 'yellow' | 'green'

// Statistics summary interface
export interface InventoryStats {
  total: number
  red: number
  yellow: number
  green: number
}

// Utility type for image upload status
export interface ImageUploadStatus {
  uploading: boolean
  progress: number
  error?: string
}

// Camera capture result
export interface CaptureResult {
  dataUrl: string
  file: File
}

// IndexedDB storage schema
export interface StorageSchema {
  foodItems: FoodItem[]
  lastSync: number
}
