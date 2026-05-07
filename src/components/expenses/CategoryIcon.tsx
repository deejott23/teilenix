import { categoryEmoji } from '@/lib/formatting'
import type { ExpenseCategory } from '@/types/app'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

// Design-spec category colours (konzept.html)
type CatStyle = { bg: string; color: string; icon: string }

const catStyles: Partial<Record<ExpenseCategory, CatStyle>> & { payment: CatStyle } = {
  food:          { bg: '#FFF4ED', color: '#E94E1B', icon: 'cat-food'      },
  transport:     { bg: '#F3F4F6', color: '#4B5563', icon: 'cat-transport' },
  accommodation: { bg: '#EFF6FF', color: '#2563EB', icon: 'cat-hotel'     },
  activities:    { bg: '#FEF3C7', color: '#B45309', icon: 'cat-activity'  },
  shopping:      { bg: '#F0FDF4', color: '#15803D', icon: 'cat-shopping'  },
  health: {
    bg: '#FDF2F8', color: '#9D174D',
    // inline SVG — no sprite icon for health
    icon: '_health',
  },
  other:         { bg: '#F3F4F6', color: '#6B7280', icon: 'cat-other'     },
  // payment is not an ExpenseCategory but shows in some expense lists
  payment:       { bg: '#ECFDF5', color: '#047857', icon: 'settle'        },
}

const sizeMap = {
  sm: { wrap: 'w-8 h-8',   iconSize: 16 },
  md: { wrap: 'w-11 h-11', iconSize: 20 },
}

interface CategoryIconProps {
  category: string
  customEmoji?: string
  size?: 'sm' | 'md'
}

export default function CategoryIcon({ category, customEmoji, size = 'md' }: CategoryIconProps) {
  const { wrap, iconSize } = sizeMap[size]

  // Custom emoji (e.g. trip emoji) — keep emoji rendering
  if (customEmoji) {
    const emojiSize = size === 'md' ? 'text-xl' : 'text-base'
    return (
      <div className={cn('rounded-2xl flex items-center justify-center flex-shrink-0 bg-muted', wrap, emojiSize)}>
        {customEmoji}
      </div>
    )
  }

  const style = catStyles[category as ExpenseCategory] ?? catStyles['payment']

  // Health icon — no sprite entry, inline SVG
  if (style.icon === '_health') {
    return (
      <div
        className={cn('rounded-2xl flex items-center justify-center flex-shrink-0', wrap)}
        style={{ background: style.bg, color: style.color }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21C12 21 4 14 4 9a5 5 0 0 1 8-4.48A5 5 0 0 1 20 9c0 5-8 12-8 12z" />
        </svg>
      </div>
    )
  }

  // Default: icon from sprite
  const fallbackEmoji = categoryEmoji[category as ExpenseCategory] ?? '🏷️'
  return (
    <div
      className={cn('rounded-2xl flex items-center justify-center flex-shrink-0', wrap)}
      style={{ background: style.bg, color: style.color }}
      aria-label={fallbackEmoji}
    >
      <Icon name={style.icon} size={iconSize} />
    </div>
  )
}
