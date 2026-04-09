import { Sk } from '@/components/ui/skeleton'

export default function PacklistLoading() {
  return (
    <div className="space-y-3">
      {/* SubNav */}
      <div className="flex gap-1.5 bg-muted p-1 rounded-[14px]">
        <Sk className="flex-1 h-8 rounded-[10px]" />
        <Sk className="flex-1 h-8 rounded-[10px]" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[60, 80, 60].map((w, i) => (
          <Sk key={i} className={`h-7 rounded-full`} style={{ width: w }} />
        ))}
      </div>

      {/* Sections */}
      {[3, 5, 2].map((count, gi) => (
        <div key={gi} className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Sk className="h-4 w-32 rounded-md" />
            <Sk className="h-4 w-16 rounded-md" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Sk className="w-5 h-5 rounded-md flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Sk className="h-3.5 w-44 rounded-md" />
                  <Sk className="h-3 w-20 rounded-md" />
                </div>
                <Sk className="w-6 h-6 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
