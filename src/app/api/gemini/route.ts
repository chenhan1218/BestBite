import { NextRequest, NextResponse } from 'next/server'
import type { GeminiResponse } from '@/types'
import {
  FOOD_RECOGNITION_PROMPT,
  parseGeminiResponse,
  isValidGeminiResponse,
  extractJSON,
  formatErrorMessage,
  hasGeminiApiKey,
} from '@/lib/gemini'

interface GeminiRequestBody {
  image_data: string
  mime_type?: string
}

/**
 * POST /api/gemini
 *
 * Processes food images using Google Gemini Vision API
 * and extracts product name, expiry date, and confidence score.
 *
 * Request body:
 * {
 *   image_data: string (base64 encoded image),
 *   mime_type?: string (default: 'image/jpeg')
 * }
 *
 * Response:
 * {
 *   product_name: string,
 *   expiry_date: string (YYYY-MM-DD),
 *   confidence: number (0-100),
 *   notes?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!hasGeminiApiKey()) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Parse request body
    const body: GeminiRequestBody = await request.json()

    if (!body.image_data) {
      return NextResponse.json(
        { error: 'Missing image_data in request body' },
        { status: 400 }
      )
    }

    const mimeType = body.mime_type || 'image/jpeg'

    // Prepare Gemini API request
    const geminiApiKey = process.env.GEMINI_API_KEY
    const geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: FOOD_RECOGNITION_PROMPT,
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: body.image_data,
              },
            },
          ],
        },
      ],
    }

    // Call Gemini API
    const geminiResponse = await fetch(`${geminiApiUrl}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error('Gemini API error:', errorData)

      return NextResponse.json(
        { error: `Gemini API error: ${errorData.error?.message || 'Unknown error'}` },
        { status: geminiResponse.status }
      )
    }

    const geminiData = await geminiResponse.json()

    // Extract text from response
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textContent) {
      return NextResponse.json(
        { error: 'No text content in Gemini response' },
        { status: 500 }
      )
    }

    // Extract and parse JSON from response
    const jsonData = extractJSON(textContent)
    if (!jsonData) {
      return NextResponse.json(
        { error: 'Failed to extract JSON from Gemini response' },
        { status: 500 }
      )
    }

    // Parse and validate response
    const parsedResponse = parseGeminiResponse(jsonData)

    if (!isValidGeminiResponse(parsedResponse)) {
      return NextResponse.json(
        { error: 'Invalid Gemini response format' },
        { status: 500 }
      )
    }

    return NextResponse.json(parsedResponse as GeminiResponse)
  } catch (error) {
    const errorMessage = formatErrorMessage(error)
    console.error('Gemini API route error:', error)

    return NextResponse.json(
      { error: `Failed to process image: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
