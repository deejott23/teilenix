import { Sk } from '@/components/ui/skeleton'

export default function FactsLoading() {
  return (
    <div className="pb-[90px]">
      {/* Masthead */}
      <Sk className="h-20 w-full rounded-none" />
      {/* Breaking strip */}
      <Sk className="h-8 w-full rounded-none mt-0" />

      <div className="pt-3 space-y-3">
        {/* Stat strip */}
        <div className="px-4">
          <div className="bg-card rounded-[16px] card-shadow border border-border flex divide-x divide-border">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex-1 flex flex-col items-center py-3 px-1 gap-1">
                <Sk className="h-5 w-8 rounded-md" />
                <Sk className="h-4 w-12 rounded-md" />
                <Sk className="h-3 w-10 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Divider + lead article */}
        <div className="flex items-center gap-2 px-4">
          <div className="flex-1 h-px bg-border" />
          <Sk className="h-3 w-24 rounded" />
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="mx-4 rounded-[18px] card-shadow border-2 border-foreground/10 p-4 space-y-2 bg-card">
          <Sk className="h-3 w-20 rounded" />
          <Sk className="h-6 w-4/5 rounded" />
          <Sk className="h-4 w-full rounded" />
          <Sk className="h-4 w-3/4 rounded" />
        </div>

        {/* Ranking */}
        <div className="mx-4 bg-foreground rounded-[18px] p-4 space-y-3">
          <Sk className="h-3 w-16 rounded opacity-30" />
          <Sk className="h-5 w-3/4 rounded opacity-30" />
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-2.5">
              <Sk className="h-6 w-6 rounded opacity-20" />
              <Sk className="h-7 w-7 rounded-full opacity-20" />
              <div className="flex-1 space-y-1">
                <Sk className="h-3 w-2/3 rounded opacity-20" />
                <Sk className="h-1.5 w-full rounded-full opacity-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
