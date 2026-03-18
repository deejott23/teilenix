/**
 * Emoji picker grid shown when creating/editing a trip
 */
export const TRIP_EMOJIS = [
  '🌍', '🌴', '🏔️', '🏖️', '🗺️', '🌅', '⛵', '🏕️',
  '✈️', '🚂', '🚗', '🚢', '🗼', '🏰', '🌊', '🎿',
  '🏄', '🧗', '🎭', '🌋', '🏜️', '🎪', '🌺', '🎡',
]

/**
 * Fallback emojis for trips without a custom emoji (deterministic by trip name)
 */
const FALLBACK_EMOJIS = ['🌴', '🏔️', '🗺️', '🌅', '⛵', '🏖️', '🌍', '🏕️']

export function pickFallbackEmoji(name: string): string {
  return FALLBACK_EMOJIS[name.charCodeAt(0) % FALLBACK_EMOJIS.length]
}
