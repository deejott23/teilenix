import type { ExpenseCategory } from '@/types/database'

/**
 * Format cents as currency string (e.g. 1250 → "€12,50")
 */
export function formatCurrency(cents: number, currency = 'EUR', locale = 'de-DE'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

/**
 * Parse a currency string or number input to cents
 * Handles both "12.50" and "12,50"
 */
export function parseToCents(value: string): number {
  const normalized = value.replace(',', '.')
  const parsed = parseFloat(normalized)
  if (isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}

/**
 * Format cents as plain number string for input fields (e.g. 1250 → "12.50")
 */
export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * Format date for display (e.g. "2024-07-15" → "15. Jul 2024")
 */
export function formatDate(dateString: string, locale = 'de-DE'): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format date for grouping headers (e.g. "Montag, 15. Juli 2024")
 */
export function formatDateLong(dateString: string, locale = 'de-DE'): string {
  return new Date(dateString).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * German labels for expense categories
 */
export const categoryLabels: Record<ExpenseCategory, string> = {
  food: 'Essen & Trinken',
  transport: 'Transport',
  accommodation: 'Unterkunft',
  activities: 'Aktivitäten',
  shopping: 'Einkauf',
  health: 'Gesundheit',
  other: 'Sonstiges',
}

/**
 * Emoji icons for expense categories
 */
export const categoryEmoji: Record<ExpenseCategory, string> = {
  food: '🍽️',
  transport: '🚗',
  accommodation: '🏠',
  activities: '🎡',
  shopping: '🛍️',
  health: '💊',
  other: '📦',
}

/**
 * Format a balance with sign (e.g. +€12,50 or -€8,00)
 */
export function formatBalance(cents: number, currency = 'EUR'): string {
  const abs = formatCurrency(Math.abs(cents), currency)
  if (cents > 0) return `+${abs}`
  if (cents < 0) return `-${abs.replace('-', '')}`
  return abs
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
