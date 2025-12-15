/**
 * Firebase Configuration and Initialization
 *
 * This module initializes Firebase services and provides exports for:
 * - db: Firestore database instance
 * - storage: Firebase Storage instance
 * - uploadImage: Upload image to Firebase Storage
 * - deleteImage: Delete image from Firebase Storage
 *
 * Usage:
 *   import { db, storage, uploadImage } from '@/lib/firebase'
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
]

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
)

if (missingEnvVars.length > 0) {
  console.error(
    'Missing Firebase environment variables: ' + missingEnvVars.join(', ')
  )
  console.error('Please check your .env.local file and ensure all Firebase variables are set.')
}

// Initialize Firebase (singleton pattern)
let app: FirebaseApp
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
  console.log('Firebase initialized successfully')
} else {
  app = getApps()[0]
}

// Initialize Firestore
export const db: Firestore = getFirestore(app)

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app)

/**
 * Upload an image to Firebase Storage
 *
 * @param file - The image file to upload
 * @param path - The storage path (e.g., 'food-items/item-id.jpg')
 * @returns Promise<string> - The download URL of the uploaded image
 *
 * @example
 * const url = await uploadImage(file, `food-items/${itemId}.jpg`)
 */
export async function uploadImage(file: File | Blob, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path)
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file)
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    console.log('Image uploaded successfully:', downloadURL)
    return downloadURL
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image to Firebase Storage')
  }
}

/**
 * Delete an image from Firebase Storage
 *
 * @param path - The storage path or full URL of the image to delete
 * @returns Promise<void>
 *
 * @example
 * await deleteImage('food-items/item-id.jpg')
 * // or
 * await deleteImage('https://firebasestorage.googleapis.com/...')
 */
export async function deleteImage(path: string): Promise<void> {
  try {
    // If path is a full URL, extract the path
    let storagePath = path
    if (path.startsWith('https://')) {
      const url = new URL(path)
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
      if (pathMatch) {
        storagePath = decodeURIComponent(pathMatch[1])
      }
    }

    const storageRef = ref(storage, storagePath)
    await deleteObject(storageRef)
    
    console.log('Image deleted successfully:', storagePath)
  } catch (error) {
    console.error('Error deleting image:', error)
    throw new Error('Failed to delete image from Firebase Storage')
  }
}

/**
 * Generate a unique storage path for a food item image
 *
 * @param itemId - The food item ID
 * @param fileName - Original file name
 * @returns string - The storage path
 *
 * @example
 * const path = generateImagePath('abc123', 'photo.jpg')
 * // Returns: 'food-items/abc123_1234567890.jpg'
 */
export function generateImagePath(itemId: string, fileName: string): string {
  const timestamp = Date.now()
  const extension = fileName.split('.').pop() || 'jpg'
  return `food-items/${itemId}_${timestamp}.${extension}`
}
