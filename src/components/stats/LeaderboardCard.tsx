import { cn } from '@/lib/utils'

interface LeaderboardItem {
  label: string
  value: string
  highlight: boolean
}

interface LeaderboardCardProps {
  title: string
  emoji: string
  items: LeaderboardItem[]
}

export default function LeaderboardCard({ title, emoji, items }: LeaderboardCardProps) {
  if (items.length === 0) return null

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
        <span>{emoji}</span>
        {title}
      </h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={cn(
              'flex items-center justify-between py-2 px-3 rounded-xl',
              item.highlight && index === 0 ? 'bg-primary/5' : 'bg-gray-50'
            )}
          >
            <div className="flex items-center gap-2">
              <span>{medals[index] ?? `#${index + 1}`}</span>
              <span className={cn(
                'text-sm font-medium',
                item.highlight ? 'text-primary' : 'text-gray-700'
              )}>
                {item.label}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-800">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
