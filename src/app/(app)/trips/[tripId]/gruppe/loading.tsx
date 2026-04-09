import { Sk } from '@/components/ui/skeleton'

export default function GruppeLoading() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <Sk className="h-4 w-24 rounded-md" />
        <Sk className="h-8 w-28 rounded-[12px]" />
      </div>
      <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0">
            <Sk className="w-11 h-11 rounded-[14px] flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <Sk className="h-3.5 w-36 rounded-md" />
                <Sk className="h-4 w-14 rounded-[6px]" />
              </div>
              <Sk className="h-3 w-48 rounded-md" />
              <Sk className="h-2.5 w-20 rounded-md" />
            </div>
            <Sk className="h-3 w-10 rounded-md flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
