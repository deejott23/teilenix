import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  action?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, subtitle, backHref, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center gap-3 mb-6', className)}>
      {backHref && (
        <Link
          href={backHref}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-white card-shadow text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="back" size={20} />
        </Link>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-foreground truncate leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
