import { Sk } from '@/components/ui/skeleton'

export default function SettlementLoading() {
  return (
    <div className="space-y-5">
      {/* SubNav */}
      <div className="flex gap-1.5 bg-muted p-1 rounded-[14px]">
        <Sk className="flex-1 h-8 rounded-[10px]" />
        <Sk className="flex-1 h-8 rounded-[10px]" />
      </div>

      {/* Summary header */}
      <div className="bg-card card-shadow rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Sk className="h-5 w-5 rounded-full" />
          <Sk className="h-5 w-40 rounded" />
        </div>
        <Sk className="h-4 w-56 rounded" />
      </div>

      {/* Who pays whom */}
      <div className="space-y-2">
        <Sk className="h-3 w-24 rounded" />
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-card card-shadow rounded-2xl p-4 flex items-center gap-3">
            <Sk className="h-8 w-8 rounded-full" />
            <Sk className="h-4 w-8 rounded" />
            <Sk className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Sk className="h-4 w-full rounded" />
            </div>
            <Sk className="h-5 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Balance table */}
      <div className="space-y-2">
        <Sk className="h-3 w-36 rounded" />
        <div className="bg-card card-shadow rounded-2xl overflow-hidden">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
              <Sk className="h-8 w-8 rounded-full" />
              <Sk className="h-4 flex-1 rounded" />
              <Sk className="h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
