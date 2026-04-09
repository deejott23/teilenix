import { Sk } from '@/components/ui/skeleton'

export default function ThreadDetailLoading() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 180px)' }}>
      {/* Linked banner */}
      <Sk className="h-16 w-full rounded-[16px] mb-3" />
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-hidden">
        {[false, true, false, false, true].map((me, i) => (
          <div key={i} className={`flex gap-2 ${me ? 'flex-row-reverse' : ''}`}>
            {!me && <Sk className="w-7 h-7 rounded-full flex-shrink-0 mt-1" />}
            <div className={`space-y-1 max-w-[65%] ${me ? 'items-end flex flex-col' : ''}`}>
              <Sk className="h-10 w-48 rounded-[18px]" />
              <Sk className="h-2.5 w-12 rounded-md" />
            </div>
          </div>
        ))}
      </div>
      {/* Input */}
      <div className="flex gap-2.5 pt-2 border-t border-border mt-2">
        <Sk className="w-9 h-9 rounded-full flex-shrink-0" />
        <Sk className="flex-1 h-9 rounded-[18px]" />
        <Sk className="w-9 h-9 rounded-full flex-shrink-0" />
      </div>
    </div>
  )
}
