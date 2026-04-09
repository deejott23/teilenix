import { Sk } from '@/components/ui/skeleton'

export default function EinkaufLoading() {
  return (
    <div className="space-y-3">
      {/* SubNav */}
      <div className="flex gap-1.5 bg-muted p-1 rounded-[14px]">
        <Sk className="flex-1 h-8 rounded-[10px]" />
        <Sk className="flex-1 h-8 rounded-[10px]" />
      </div>

      {/* Add input skeleton */}
      <div className="flex gap-2">
        <Sk className="flex-1 h-11 rounded-[14px]" />
        <Sk className="w-11 h-11 rounded-[14px] flex-shrink-0" />
      </div>

      {/* Category groups */}
      {[3, 4, 2].map((count, gi) => (
        <div key={gi} className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <Sk className="w-5 h-5 rounded-md flex-shrink-0" />
            <Sk className="h-3.5 w-28 rounded-md" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <Sk className="w-5 h-5 rounded-full flex-shrink-0" />
                <Sk className="flex-1 h-3.5 rounded-md" />
                <div className="flex items-center gap-1">
                  <Sk className="w-6 h-6 rounded-md" />
                  <Sk className="w-6 h-4 rounded-md" />
                  <Sk className="w-6 h-6 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
