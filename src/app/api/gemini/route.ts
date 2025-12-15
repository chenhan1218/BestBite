/**
 * Gemini API Route
 *
 * POST /api/gemini
 * Receives image data and returns food recognition results
 *
 * Request:
 *   { image: string (base64), mimeType: string }
 *
 * Response:
 *   { product_name: string, expiry_date: string, confidence: number, notes?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { recognizeFood } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { image, mimeType } = body

    // Validate input
    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    if (!mimeType) {
      return NextResponse.json(
        { error: 'MIME type is required' },
        { status: 400 }
      )
    }

    // Validate MIME type
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validMimeTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid MIME type. Supported: JPEG, PNG, WebP' },
        { status: 400 }
      )
    }

    // Call Gemini API
    console.log('Calling Gemini API for food recognition...')
    const result = await recognizeFood(image, mimeType)

    // Log result
    console.log('Gemini API result:', result)

    // Return successful response
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Gemini API route error:', error)

    // Return error response
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        product_name: '',
        expiry_date: '',
        confidence: 0,
      },
      { status: 500 }
    )
  }
}

// Prevent caching
export const dynamic = 'force-dynamic'
