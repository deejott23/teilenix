'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ActivityStreamCollapsible({
  count,
  children,
}: {
  count: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 active:bg-muted transition-colors"
      >
        <span className="text-[14px] font-bold text-foreground">Letzte Aktivität</span>
        <div className="flex items-center gap-2">
          {!open && count > 0 && (
            <span className="text-[11px] font-semibold text-muted-foreground">{count} Einträge</span>
          )}
          <ChevronDown
            className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
            strokeWidth={2}
          />
        </div>
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {children}
        </div>
      )}
    </div>
  )
}
