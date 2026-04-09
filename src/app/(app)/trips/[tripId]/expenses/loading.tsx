import { Sk } from '@/components/ui/skeleton'

function ExpenseCardSk() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Sk className="w-10 h-10 rounded-[14px] flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Sk className="h-3.5 w-40 rounded-md" />
        <Sk className="h-3 w-24 rounded-md" />
      </div>
      <div className="text-right space-y-1.5">
        <Sk className="h-3.5 w-16 rounded-md ml-auto" />
        <Sk className="h-3 w-12 rounded-md ml-auto" />
      </div>
    </div>
  )
}

export default function ExpensesLoading() {
  return (
    <div className="space-y-4">
      {/* GeldSubNav */}
      <div className="flex gap-1.5 bg-muted p-1 rounded-[14px]">
        {[0, 1, 2].map(i => (
          <Sk key={i} className="flex-1 h-8 rounded-[10px]" />
        ))}
      </div>

      {/* New expense button */}
      <Sk className="h-11 w-full rounded-2xl" />

      {/* Expense groups */}
      {[4, 3, 2].map((count, gi) => (
        <div key={gi} className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <Sk className="h-3 w-28 rounded-md" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: count }).map((_, i) => (
              <ExpenseCardSk key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
