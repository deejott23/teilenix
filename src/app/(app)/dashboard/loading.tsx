import { Sk } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div
        className="-mx-4 -mt-7 mb-6 px-6 pt-8 pb-7 rounded-b-3xl"
        style={{ background: 'linear-gradient(150deg, #1E6FD9 0%, #1558b0 100%)' }}
      >
        <Sk className="h-2.5 w-16 mb-3 bg-white/20" />
        <Sk className="h-8 w-48 mb-2 bg-white/20" />
        <Sk className="h-3.5 w-28 bg-white/10" />
      </div>

      <div className="space-y-6">
        {/* Action buttons */}
        <div className="space-y-2.5">
          <Sk className="h-12 w-full rounded-2xl" />
          <Sk className="h-12 w-full rounded-2xl" />
        </div>

        {/* Section label */}
        <Sk className="h-3 w-24 rounded-md" />

        {/* Trip cards */}
        {[0, 1].map(i => (
          <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
            <Sk className="w-11 h-11 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Sk className="h-4 w-36 rounded-md" />
              <Sk className="h-3 w-24 rounded-md" />
            </div>
            <Sk className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
