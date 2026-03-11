import { categoryEmoji } from '@/lib/formatting'
import type { ExpenseCategory } from '@/types/database'
import { cn } from '@/lib/utils'

const categoryColors: Record<ExpenseCategory, string> = {
  food: 'bg-orange-50',
  transport: 'bg-blue-50',
  accommodation: 'bg-purple-50',
  activities: 'bg-yellow-50',
  shopping: 'bg-pink-50',
  health: 'bg-red-50',
  other: 'bg-gray-50',
}

interface CategoryIconProps {
  category: ExpenseCategory
  size?: 'sm' | 'md'
}

export default function CategoryIcon({ category, size = 'md' }: CategoryIconProps) {
  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center flex-shrink-0',
        categoryColors[category],
        size === 'md' ? 'w-11 h-11 text-xl' : 'w-8 h-8 text-base'
      )}
    >
      {categoryEmoji[category]}
    </div>
  )
}
