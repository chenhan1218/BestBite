/**
 * Date Utility Functions for BestBite
 *
 * Handles date calculations, formatting, and expiry status determination.
 */

import type { FoodStatus } from '@/types'

/**
 * Calculate the number of days between two dates
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between the dates (can be negative)
 */
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())
  return Math.floor((utc2 - utc1) / msPerDay)
}

/**
 * Calculate days until expiry from today
 *
 * @param expiryDate - Expiry date string in YYYY-MM-DD format
 * @returns Number of days until expiry (negative if already expired)
 */
export function calculateDaysUntilExpiry(expiryDate: string): number {
  const today = new Date()
  const expiry = new Date(expiryDate)
  return daysBetween(today, expiry)
}

/**
 * Determine food status based on days until expiry
 *
 * Logic:
 * - Red (緊急): ≤7 days
 * - Yellow (注意): 8-30 days
 * - Green (安全): >30 days
 *
 * @param daysUntilExpiry - Number of days until expiry
 * @returns Status color code
 */
export function getFoodStatus(daysUntilExpiry: number): FoodStatus {
  if (daysUntilExpiry <= 7) {
    return 'red'
  } else if (daysUntilExpiry <= 30) {
    return 'yellow'
  } else {
    return 'green'
  }
}

/**
 * Format date string for display
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date in Chinese format (YYYY年MM月DD日)
 */
export function formatDateChinese(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}年${month}月${day}日`
}

/**
 * Format date to YYYY-MM-DD string
 *
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get today's date in YYYY-MM-DD format
 *
 * @returns Today's date string
 */
export function getTodayISO(): string {
  return formatDateISO(new Date())
}

/**
 * Validate if a date string is in YYYY-MM-DD format
 *
 * @param dateString - Date string to validate
 * @returns True if valid, false otherwise
 */
export function isValidDateFormat(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) {
    return false
  }

  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * Get status label in Chinese
 *
 * @param status - Food status
 * @returns Chinese label for the status
 */
export function getStatusLabel(status: FoodStatus): string {
  switch (status) {
    case 'red':
      return '緊急'
    case 'yellow':
      return '注意'
    case 'green':
      return '安全'
  }
}

/**
 * Get friendly message based on days until expiry
 *
 * @param daysUntilExpiry - Number of days until expiry
 * @returns Friendly Chinese message
 */
export function getExpiryMessage(daysUntilExpiry: number): string {
  if (daysUntilExpiry < 0) {
    return '已過期！請勿食用'
  } else if (daysUntilExpiry === 0) {
    return '今天到期！趁新鮮快吃'
  } else if (daysUntilExpiry === 1) {
    return '明天到期！趁新鮮快吃'
  } else if (daysUntilExpiry <= 3) {
    return `剩 ${daysUntilExpiry} 天！趁新鮮快吃`
  } else if (daysUntilExpiry <= 7) {
    return `剩 ${daysUntilExpiry} 天，請盡快食用`
  } else if (daysUntilExpiry <= 14) {
    return `剩 ${daysUntilExpiry} 天，請留意`
  } else if (daysUntilExpiry <= 30) {
    return `剩 ${daysUntilExpiry} 天`
  } else {
    return `還有 ${daysUntilExpiry} 天，新鮮度良好`
  }
}

/**
 * Check if a date is in the past
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns True if the date is in the past
 */
export function isPastDate(dateString: string): boolean {
  return calculateDaysUntilExpiry(dateString) < 0
}

/**
 * Sort food items by expiry date (closest expiry first)
 *
 * @param items - Array of items with expiry_date property
 * @returns Sorted array
 */
export function sortByExpiryDate<T extends { expiry_date: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.expiry_date).getTime()
    const dateB = new Date(b.expiry_date).getTime()
    return dateA - dateB
  })
}
