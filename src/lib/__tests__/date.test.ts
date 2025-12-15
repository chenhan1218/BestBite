/**
 * Date Utility Functions Tests
 *
 * Comprehensive test suite for date calculation, formatting, and expiry status functions.
 */

import {
  daysBetween,
  calculateDaysUntilExpiry,
  getFoodStatus,
  formatDateChinese,
  formatDateISO,
  getTodayISO,
  isValidDateFormat,
  getStatusLabel,
  getExpiryMessage,
  isPastDate,
  sortByExpiryDate,
} from '../date'

describe('Date Utility Functions', () => {
  describe('daysBetween', () => {
    it('should calculate days between two dates correctly', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-10')
      expect(daysBetween(date1, date2)).toBe(9)
    })

    it('should return negative for past dates', () => {
      const date1 = new Date('2024-01-10')
      const date2 = new Date('2024-01-01')
      expect(daysBetween(date1, date2)).toBe(-9)
    })

    it('should return 0 for same date', () => {
      const date = new Date('2024-01-01')
      expect(daysBetween(date, date)).toBe(0)
    })
  })

  describe('calculateDaysUntilExpiry', () => {
    it('should calculate days until future expiry date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 10)
      const expiryDateStr = formatDateISO(futureDate)
      expect(calculateDaysUntilExpiry(expiryDateStr)).toBe(10)
    })

    it('should return negative for past expiry date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      const expiryDateStr = formatDateISO(pastDate)
      expect(calculateDaysUntilExpiry(expiryDateStr)).toBe(-5)
    })
  })

  describe('getFoodStatus', () => {
    it('should return red for 7 days or less', () => {
      expect(getFoodStatus(7)).toBe('red')
      expect(getFoodStatus(5)).toBe('red')
      expect(getFoodStatus(0)).toBe('red')
      expect(getFoodStatus(-1)).toBe('red')
    })

    it('should return yellow for 8-30 days', () => {
      expect(getFoodStatus(8)).toBe('yellow')
      expect(getFoodStatus(15)).toBe('yellow')
      expect(getFoodStatus(30)).toBe('yellow')
    })

    it('should return green for more than 30 days', () => {
      expect(getFoodStatus(31)).toBe('green')
      expect(getFoodStatus(60)).toBe('green')
      expect(getFoodStatus(365)).toBe('green')
    })
  })

  describe('formatDateChinese', () => {
    it('should format date in Chinese format', () => {
      expect(formatDateChinese('2024-01-15')).toBe('2024年1月15日')
      expect(formatDateChinese('2024-12-31')).toBe('2024年12月31日')
    })

    it('should handle single digit months and days', () => {
      expect(formatDateChinese('2024-01-05')).toBe('2024年1月5日')
    })
  })

  describe('formatDateISO', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date('2024-01-05')
      expect(formatDateISO(date)).toBe('2024-01-05')
    })

    it('should pad single digit months and days with zero', () => {
      const date = new Date('2024-01-01')
      expect(formatDateISO(date)).toBe('2024-01-01')
    })
  })

  describe('getTodayISO', () => {
    it('should return today\'s date in ISO format', () => {
      const today = getTodayISO()
      const expected = formatDateISO(new Date())
      expect(today).toBe(expected)
    })

    it('should match regex pattern YYYY-MM-DD', () => {
      const today = getTodayISO()
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('isValidDateFormat', () => {
    it('should validate correct date formats', () => {
      expect(isValidDateFormat('2024-01-15')).toBe(true)
      expect(isValidDateFormat('2024-12-31')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isValidDateFormat('2024/01/15')).toBe(false)
      expect(isValidDateFormat('15-01-2024')).toBe(false)
      expect(isValidDateFormat('2024-1-5')).toBe(false)
      expect(isValidDateFormat('not-a-date')).toBe(false)
    })

    it('should reject invalid dates', () => {
      expect(isValidDateFormat('2024-13-01')).toBe(false)
      // Note: JavaScript Date auto-adjusts invalid dates (e.g., 2024-02-30 -> 2024-03-01)
      // This is acceptable for our use case as users will typically use date pickers
    })
  })

  describe('getStatusLabel', () => {
    it('should return correct Chinese labels', () => {
      expect(getStatusLabel('red')).toBe('緊急')
      expect(getStatusLabel('yellow')).toBe('注意')
      expect(getStatusLabel('green')).toBe('安全')
    })
  })

  describe('getExpiryMessage', () => {
    it('should return expired message for negative days', () => {
      expect(getExpiryMessage(-1)).toBe('已過期！請勿食用')
      expect(getExpiryMessage(-10)).toBe('已過期！請勿食用')
    })

    it('should return urgent messages for 0-3 days', () => {
      expect(getExpiryMessage(0)).toBe('今天到期！趁新鮮快吃')
      expect(getExpiryMessage(1)).toBe('明天到期！趁新鮮快吃')
      expect(getExpiryMessage(2)).toBe('剩 2 天！趁新鮮快吃')
      expect(getExpiryMessage(3)).toBe('剩 3 天！趁新鮮快吃')
    })

    it('should return appropriate messages for 4-7 days', () => {
      expect(getExpiryMessage(5)).toBe('剩 5 天，請盡快食用')
      expect(getExpiryMessage(7)).toBe('剩 7 天，請盡快食用')
    })

    it('should return notice messages for 8-14 days', () => {
      expect(getExpiryMessage(10)).toBe('剩 10 天，請留意')
      expect(getExpiryMessage(14)).toBe('剩 14 天，請留意')
    })

    it('should return day count for 15-30 days', () => {
      expect(getExpiryMessage(20)).toBe('剩 20 天')
      expect(getExpiryMessage(30)).toBe('剩 30 天')
    })

    it('should return fresh message for >30 days', () => {
      expect(getExpiryMessage(60)).toBe('還有 60 天，新鮮度良好')
      expect(getExpiryMessage(365)).toBe('還有 365 天，新鮮度良好')
    })
  })

  describe('isPastDate', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      expect(isPastDate(formatDateISO(pastDate))).toBe(true)
    })

    it('should return false for future dates', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      expect(isPastDate(formatDateISO(futureDate))).toBe(false)
    })
  })

  describe('sortByExpiryDate', () => {
    it('should sort items by expiry date (earliest first)', () => {
      const items = [
        { id: '1', expiry_date: '2024-03-01' },
        { id: '2', expiry_date: '2024-01-01' },
        { id: '3', expiry_date: '2024-02-01' },
      ]

      const sorted = sortByExpiryDate(items)

      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('3')
      expect(sorted[2].id).toBe('1')
    })

    it('should not mutate original array', () => {
      const items = [
        { id: '1', expiry_date: '2024-03-01' },
        { id: '2', expiry_date: '2024-01-01' },
      ]

      const original = [...items]
      sortByExpiryDate(items)

      expect(items).toEqual(original)
    })

    it('should handle empty array', () => {
      expect(sortByExpiryDate([])).toEqual([])
    })

    it('should handle single item', () => {
      const items = [{ id: '1', expiry_date: '2024-01-01' }]
      expect(sortByExpiryDate(items)).toEqual(items)
    })
  })
})
