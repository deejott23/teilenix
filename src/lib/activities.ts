import type { ActivityType } from '@/types/app'

export const activityTypeEmoji: Record<ActivityType, string> = {
  activity:  '🥾',
  boat:      '⛵',
  food:      '🍽️',
  culture:   '🏛️',
  swimming:  '🏖️',
  shopping:  '🛍️',
  other:     '📍',
}

export const activityTypeLabel: Record<ActivityType, string> = {
  activity:  'Aktivität',
  boat:      'Bootsfahrt',
  food:      'Essen & Trinken',
  culture:   'Kultur',
  swimming:  'Baden',
  shopping:  'Shopping',
  other:     'Sonstiges',
}

export const activityTypeGradient: Record<ActivityType, string> = {
  activity:  'from-teal-400 to-teal-600',
  boat:      'from-blue-400 to-blue-700',
  food:      'from-pink-300 to-pink-600',
  culture:   'from-violet-400 to-violet-700',
  swimming:  'from-cyan-300 to-cyan-600',
  shopping:  'from-orange-300 to-orange-600',
  other:     'from-gray-400 to-gray-600',
}

export function formatDepartureTime(time: string | null): string | null {
  if (!time) return null
  // PostgreSQL time format is HH:MM:SS — return HH:MM
  return time.slice(0, 5)
}
