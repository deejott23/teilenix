export default function KalenderLoading() {
  return (
    <div className="space-y-2 pb-[90px]">
      {/* Tab nav skeleton */}
      <div className="h-10 bg-muted animate-pulse rounded-[14px]" />
      {/* Column labels */}
      <div className="grid grid-cols-2 gap-2 px-1">
        <div className="h-3 bg-muted animate-pulse rounded" />
        <div className="h-3 bg-muted animate-pulse rounded" />
      </div>
      {/* Day cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-card rounded-[16px] border border-border overflow-hidden">
          <div className="h-9 bg-muted/40 animate-pulse" />
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="p-2 space-y-1.5">
              <div className="h-10 bg-muted animate-pulse rounded-[10px]" />
              <div className="h-10 bg-muted animate-pulse rounded-[10px]" />
            </div>
            <div className="p-2 space-y-1.5">
              <div className="h-10 bg-muted animate-pulse rounded-[10px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
