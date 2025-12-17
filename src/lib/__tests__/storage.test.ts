/**
 * IndexedDB Storage Layer Tests
 *
 * Tests for IndexedDB operations including CRUD, sync tracking, and filtering.
 */

import 'fake-indexeddb/auto'
import {
  initStorage,
  getAllFoodItems,
  getFoodItem,
  addFoodItem,
  updateFoodItem,
  deleteFoodItem,
  clearAllFoodItems,
  getLastSyncTime,
  setLastSyncTime,
  getFoodItemsByStatus,
  itemExists,
} from '../storage'
import type { FoodItem } from '@/types'

/**
 * Helper function to create test food items
 */
function createTestItem(overrides?: Partial<FoodItem>): FoodItem {
  const now = new Date()
  return {
    id: `test-${Date.now()}-${Math.random()}`,
    product_name: 'Test Product',
    expiry_date: '2025-12-25',
    days_until_expiry: 10,
    status: 'yellow',
    image_url: 'http://example.com/image.jpg',
    confidence: 85,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

describe('IndexedDB Storage', () => {
  beforeEach(async () => {
    // Initialize storage before each test
    await initStorage()
    // Clear all items to start fresh
    await clearAllFoodItems()
  })

  describe('initStorage', () => {
    it('should initialize storage without errors', async () => {
      await expect(initStorage()).resolves.not.toThrow()
    })
  })

  describe('addFoodItem', () => {
    it('should add a food item to storage', async () => {
      const item = createTestItem()
      await addFoodItem(item)

      const retrieved = await getFoodItem(item.id)
      expect(retrieved?.id).toBe(item.id)
      expect(retrieved?.product_name).toBe(item.product_name)
      expect(retrieved?.status).toBe(item.status)
    })

    it('should add multiple items', async () => {
      const item1 = createTestItem()
      const item2 = createTestItem()

      await addFoodItem(item1)
      await addFoodItem(item2)

      const all = await getAllFoodItems()
      expect(all).toHaveLength(2)
      expect(all.map(i => i.id)).toContain(item1.id)
      expect(all.map(i => i.id)).toContain(item2.id)
    })
  })

  describe('getFoodItem', () => {
    it('should retrieve a food item by ID', async () => {
      const item = createTestItem()
      await addFoodItem(item)

      const retrieved = await getFoodItem(item.id)
      expect(retrieved?.id).toBe(item.id)
      expect(retrieved?.product_name).toBe(item.product_name)
      expect(retrieved?.expiry_date).toBe(item.expiry_date)
    })

    it('should return null for non-existent item', async () => {
      const retrieved = await getFoodItem('non-existent-id')
      expect(retrieved).toBeNull()
    })
  })

  describe('getAllFoodItems', () => {
    it('should return empty array when no items exist', async () => {
      const items = await getAllFoodItems()
      expect(items).toEqual([])
    })

    it('should return all stored items', async () => {
      const item1 = createTestItem()
      const item2 = createTestItem()
      const item3 = createTestItem()

      await addFoodItem(item1)
      await addFoodItem(item2)
      await addFoodItem(item3)

      const all = await getAllFoodItems()
      expect(all).toHaveLength(3)
    })
  })

  describe('updateFoodItem', () => {
    it('should update an existing food item', async () => {
      const item = createTestItem()
      await addFoodItem(item)

      const updated = { product_name: 'Updated Name', days_until_expiry: 5 }
      await updateFoodItem(item.id, updated)

      const retrieved = await getFoodItem(item.id)
      expect(retrieved?.product_name).toBe('Updated Name')
      expect(retrieved?.days_until_expiry).toBe(5)
      // Original fields should remain unchanged
      expect(retrieved?.image_url).toBe(item.image_url)
    })

    it('should throw error when updating non-existent item', async () => {
      await expect(updateFoodItem('non-existent', { product_name: 'New' })).rejects.toThrow()
    })
  })

  describe('deleteFoodItem', () => {
    it('should delete a food item', async () => {
      const item = createTestItem()
      await addFoodItem(item)

      expect(await getFoodItem(item.id)).toBeDefined()

      await deleteFoodItem(item.id)

      expect(await getFoodItem(item.id)).toBeNull()
    })

    it('should not throw error when deleting non-existent item', async () => {
      // IndexedDB delete doesn't throw for non-existent keys
      await expect(deleteFoodItem('non-existent')).resolves.not.toThrow()
    })
  })

  describe('clearAllFoodItems', () => {
    it('should clear all items from storage', async () => {
      const item1 = createTestItem()
      const item2 = createTestItem()

      await addFoodItem(item1)
      await addFoodItem(item2)

      expect(await getAllFoodItems()).toHaveLength(2)

      await clearAllFoodItems()

      expect(await getAllFoodItems()).toHaveLength(0)
    })
  })

  describe('getLastSyncTime / setLastSyncTime', () => {
    it('should return 0 for first access', async () => {
      const time = await getLastSyncTime()
      expect(time).toBe(0)
    })

    it('should store and retrieve sync timestamp', async () => {
      const timestamp = Date.now()
      await setLastSyncTime(timestamp)

      const retrieved = await getLastSyncTime()
      expect(retrieved).toBe(timestamp)
    })

    it('should update sync timestamp on subsequent calls', async () => {
      const time1 = Date.now()
      await setLastSyncTime(time1)

      const time2 = Date.now() + 1000
      await setLastSyncTime(time2)

      const retrieved = await getLastSyncTime()
      expect(retrieved).toBe(time2)
    })
  })

  describe('getFoodItemsByStatus', () => {
    it('should filter items by status', async () => {
      const redItem = createTestItem({ status: 'red' })
      const yellowItem = createTestItem({ status: 'yellow' })
      const greenItem = createTestItem({ status: 'green' })

      await addFoodItem(redItem)
      await addFoodItem(yellowItem)
      await addFoodItem(greenItem)

      const redItems = await getFoodItemsByStatus('red')
      expect(redItems).toHaveLength(1)
      expect(redItems[0].id).toBe(redItem.id)
      expect(redItems[0].status).toBe('red')

      const yellowItems = await getFoodItemsByStatus('yellow')
      expect(yellowItems).toHaveLength(1)
    })

    it('should return empty array for status with no items', async () => {
      const greenItems = await getFoodItemsByStatus('green')
      expect(greenItems).toEqual([])
    })
  })

  describe('itemExists', () => {
    it('should return true for existing item', async () => {
      const item = createTestItem()
      await addFoodItem(item)

      const exists = await itemExists(item.id)
      expect(exists).toBe(true)
    })

    it('should return false for non-existent item', async () => {
      const exists = await itemExists('non-existent')
      expect(exists).toBe(false)
    })
  })
})
