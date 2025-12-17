// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Set up mock Firebase environment variables for testing
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id'
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-bucket.appspot.com'
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id'
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id'

// Polyfill structuredClone for Jest environment
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj))
}
