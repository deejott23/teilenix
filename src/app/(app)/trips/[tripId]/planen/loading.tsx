import { Sk } from '@/components/ui/skeleton'

export default function PlanenLoading() {
  return (
    <div className="space-y-3">
      {/* SubNav */}
      <div className="flex gap-1.5 bg-muted p-1 rounded-[14px]">
        <Sk className="flex-1 h-8 rounded-[10px]" />
        <Sk className="flex-1 h-8 rounded-[10px]" />
      </div>

      {/* Date strip */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Sk key={i} className="w-12 h-14 rounded-[14px] flex-shrink-0" />
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {[48, 80, 56].map((w, i) => (
          <Sk key={i} className="h-8 rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* Activity cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
          <Sk className="h-28 w-full rounded-none" />
          <div className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1.5">
                <Sk className="h-4 w-44 rounded-md" />
                <Sk className="h-3 w-28 rounded-md" />
              </div>
              <Sk className="h-6 w-16 rounded-full flex-shrink-0" />
            </div>
            <div className="flex gap-2 pt-1">
              <Sk className="flex-1 h-9 rounded-[12px]" />
              <Sk className="flex-1 h-9 rounded-[12px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
