/**
 * Firebase Initialization and Configuration
 *
 * Handles Firebase app initialization, user ID management for anonymous mode,
 * and exports Firestore/Storage instances for use throughout the application.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

/**
 * Firebase configuration from environment variables
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

// Singleton pattern - ensure only one Firebase app instance
let app: FirebaseApp

/**
 * Initialize Firebase app
 * Uses singleton pattern to ensure only one instance
 */
function getOrInitializeApp(): FirebaseApp {
  try {
    // Try to get existing app
    return getApp()
  } catch {
    // App doesn't exist, initialize it
    if (!app) {
      validateFirebaseConfig()
      app = initializeApp(firebaseConfig)
    }
    return app
  }
}

/**
 * Validate that all required Firebase environment variables are set
 * Throws error if any critical config is missing
 */
function validateFirebaseConfig(): void {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ] as const

  const missing = requiredKeys.filter(
    (key) => !firebaseConfig[key] || firebaseConfig[key].trim() === ''
  )

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missing.join(', ')}. ` +
      'Please check your .env.local file and Firebase Console settings.'
    )
  }
}

/**
 * Constants for localStorage keys
 */
const STORAGE_KEYS = {
  USER_ID: 'bestbite_user_id',
  LAST_INITIALIZED: 'bestbite_last_init',
} as const

/**
 * Generate a unique UUID for anonymous user identification
 * Uses crypto.getRandomValues() for browser compatibility
 */
export function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // Fallback for non-browser environments (testing)
  return `${Date.now()}-${Math.random().toString(36).substring(2)}`
}

/**
 * Get or create a unique user ID for the current browser/device
 * Stored in localStorage for persistence
 */
export function getOrCreateUserID(): string {
  if (typeof window === 'undefined') {
    // Server-side: return a temporary ID (for API routes)
    return 'server-side-temp'
  }

  try {
    // Check if user ID already exists in localStorage
    const existingUserID = localStorage.getItem(STORAGE_KEYS.USER_ID)
    if (existingUserID) {
      return existingUserID
    }

    // Generate new user ID if not found
    const newUserID = generateUUID()
    localStorage.setItem(STORAGE_KEYS.USER_ID, newUserID)
    localStorage.setItem(STORAGE_KEYS.LAST_INITIALIZED, new Date().toISOString())

    return newUserID
  } catch (error) {
    // Fallback if localStorage is unavailable (private browsing, etc.)
    console.warn(
      'localStorage unavailable, using session-only user ID. Data will not persist.',
      error
    )
    return `session-${generateUUID()}`
  }
}

/**
 * Clear the stored user ID from localStorage
 * Used for testing or user logout scenarios
 */
export function clearUserID(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_ID)
      localStorage.removeItem(STORAGE_KEYS.LAST_INITIALIZED)
    } catch (error) {
      console.warn('Failed to clear user ID', error)
    }
  }
}

/**
 * Initialize Firebase and perform validation checks
 * Should be called once during app initialization
 */
export async function initializeFirebase(): Promise<void> {
  try {
    // Initialize Firebase app
    const app = getOrInitializeApp()

    // Validate that Firestore and Storage are accessible
    const db = getFirestore(app)
    const storage = getStorage(app)

    // Get or create user ID
    const userID = getOrCreateUserID()

    // Verify Firebase initialization was successful
    if (!app || !db || !storage) {
      throw new Error('Firebase initialization failed')
    }

    // Log initialization success in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Firebase] Initialized successfully', {
        projectId: firebaseConfig.projectId,
        userID: userID.substring(0, 8) + '...',
      })
    }
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error)
    throw error
  }
}

/**
 * Firebase app instance (singleton)
 */
export const firebase = getOrInitializeApp()

/**
 * Firestore database instance
 */
export const db = getFirestore(firebase)

/**
 * Firebase Storage instance
 */
export const storage = getStorage(firebase)

/**
 * Firestore database collection paths (constants for type safety)
 */
export const FIRESTORE_PATHS = {
  users: (userId: string) => `users/${userId}`,
  foodItems: (userId: string) => `users/${userId}/food_items`,
  foodItem: (userId: string, itemId: string) => `users/${userId}/food_items/${itemId}`,
} as const

/**
 * Firebase Storage paths (constants for consistency)
 */
export const STORAGE_PATHS = {
  userImages: (userId: string) => `users/${userId}/images`,
  userImage: (userId: string, itemId: string) => `users/${userId}/images/${itemId}.jpg`,
} as const
