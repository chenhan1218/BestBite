/**
 * Firebase Module Tests
 *
 * Tests for Firebase initialization, user ID generation, and storage management.
 */

import { getOrCreateUserID, clearUserID, generateUUID, initializeFirebase } from '../firebase'

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => {
    throw new Error('No app')
  }),
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
}))

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
}))

describe('Firebase Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
    jest.clearAllMocks()
  })

  describe('generateUUID', () => {
    it('should generate a valid UUID format', () => {
      const uuid = generateUUID()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(uuid).toMatch(uuidRegex)
    })

    it('should generate different UUIDs on multiple calls', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      expect(uuid1).not.toBe(uuid2)
    })
  })

  describe('getOrCreateUserID', () => {
    it('should create a new user ID if none exists', () => {
      const userID = getOrCreateUserID()
      expect(userID).toBeDefined()
      expect(userID.length).toBeGreaterThan(0)
    })

    it('should return the same user ID on subsequent calls', () => {
      const userID1 = getOrCreateUserID()
      const userID2 = getOrCreateUserID()
      expect(userID1).toBe(userID2)
    })

    it('should store user ID in localStorage', () => {
      const userID = getOrCreateUserID()
      const stored = localStorage.getItem('bestbite_user_id')
      expect(stored).toBe(userID)
    })

    it('should store initialization timestamp', () => {
      getOrCreateUserID()
      const timestamp = localStorage.getItem('bestbite_last_init')
      expect(timestamp).toBeDefined()
      expect(new Date(timestamp!).getTime()).toBeCloseTo(Date.now(), -3) // Within 1 second
    })

    it('should retrieve existing user ID from localStorage', () => {
      const existingUserID = 'existing-uuid-12345'
      localStorage.setItem('bestbite_user_id', existingUserID)

      const userID = getOrCreateUserID()
      expect(userID).toBe(existingUserID)
    })

    it('should return session-only ID when localStorage is unavailable', () => {
      // Mock localStorage to throw error
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      const userID = getOrCreateUserID()
      expect(userID).toContain('session-')

      setItemSpy.mockRestore()
    })
  })

  describe('clearUserID', () => {
    it('should remove user ID from localStorage', () => {
      getOrCreateUserID()
      expect(localStorage.getItem('bestbite_user_id')).toBeDefined()

      clearUserID()
      expect(localStorage.getItem('bestbite_user_id')).toBeNull()
    })

    it('should remove initialization timestamp', () => {
      getOrCreateUserID()
      expect(localStorage.getItem('bestbite_last_init')).toBeDefined()

      clearUserID()
      expect(localStorage.getItem('bestbite_last_init')).toBeNull()
    })

    it('should not throw error if localStorage is unavailable', () => {
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem')
      removeItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      expect(() => clearUserID()).not.toThrow()

      removeItemSpy.mockRestore()
    })
  })

  describe('initializeFirebase', () => {
    it('should initialize Firebase without errors', async () => {
      await expect(initializeFirebase()).resolves.not.toThrow()
    })

    it('should create a user ID during initialization', async () => {
      await initializeFirebase()
      const userID = getOrCreateUserID()
      expect(userID).toBeDefined()
    })
  })
})
