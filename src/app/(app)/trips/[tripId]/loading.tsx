import { Sk } from '@/components/ui/skeleton'

export default function TripHomeSkeleton() {
  return (
    <div className="space-y-3">

      {/* Balance Card */}
      <div className="flex items-center gap-3.5 bg-card rounded-[16px] card-shadow border border-border border-l-4 border-l-green-500 px-4 py-3.5">
        <div className="space-y-1.5">
          <Sk className="h-6 w-20 rounded-md" />
          <Sk className="h-3 w-16 rounded-md" />
        </div>
        <div className="w-px h-9 bg-border flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Sk className="h-4 w-24 rounded-md" />
          <Sk className="h-3 w-28 rounded-md" />
        </div>
      </div>

      {/* Ausflüge Card */}
      <div className="bg-card rounded-[18px] card-shadow border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Sk className="h-4 w-36 rounded-md" />
          <Sk className="h-4 w-10 rounded-md" />
        </div>
        {[0, 1].map(i => (
          <div key={i} className="flex items-center gap-2.5">
            <Sk className="w-9 h-9 rounded-[12px] flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Sk className="h-3.5 w-40 rounded-md" />
              <Sk className="h-3 w-24 rounded-md" />
            </div>
            <Sk className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>

      {/* Split Cards */}
      <div className="flex gap-2.5">
        {[0, 1].map(i => (
          <div key={i} className="flex-1 bg-card rounded-[18px] card-shadow border border-border p-3.5 space-y-2">
            <Sk className="w-8 h-8 rounded-xl" />
            <Sk className="h-2.5 w-14 rounded-md" />
            <Sk className="h-6 w-12 rounded-md" />
            <Sk className="h-1.5 w-full rounded-full" />
            <Sk className="h-2.5 w-20 rounded-md" />
          </div>
        ))}
      </div>

      {/* Activity Stream */}
      <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <Sk className="h-4 w-32 rounded-md" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-4 py-2.5">
              <Sk className="w-2 h-2 rounded-full flex-shrink-0" />
              <Sk className="w-8 h-8 rounded-[10px] flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Sk className="h-3.5 w-36 rounded-md" />
                <Sk className="h-3 w-28 rounded-md" />
              </div>
              <Sk className="h-4 w-12 rounded-md" />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
