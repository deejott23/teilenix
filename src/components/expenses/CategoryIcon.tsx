import { categoryEmoji } from '@/lib/formatting'
import type { ExpenseCategory } from '@/types/app'
import { cn } from '@/lib/utils'

const categoryColors: Record<ExpenseCategory, string> = {
  food:          'bg-orange-50   text-orange-500',
  transport:     'bg-sky-50      text-sky-500',
  accommodation: 'bg-violet-50   text-violet-500',
  activities:    'bg-amber-50    text-amber-500',
  shopping:      'bg-pink-50     text-pink-500',
  health:        'bg-rose-50     text-rose-500',
  other:         'bg-slate-50    text-slate-400',
}

interface CategoryIconProps {
  category: string
  customEmoji?: string
  size?: 'sm' | 'md'
}

export default function CategoryIcon({ category, customEmoji, size = 'md' }: CategoryIconProps) {
  const emoji = customEmoji ?? categoryEmoji[category as ExpenseCategory] ?? '🏷️'
  const colorClass = categoryColors[category as ExpenseCategory] ?? 'bg-teal-50 text-teal-500'
  return (
    <div className={cn(
      'rounded-2xl flex items-center justify-center flex-shrink-0',
      colorClass,
      size === 'md' ? 'w-11 h-11 text-xl' : 'w-8 h-8 text-base'
    )}>
      {emoji}
    </div>
  )
}
