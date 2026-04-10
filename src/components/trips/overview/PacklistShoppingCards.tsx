import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PacklistShoppingCards({
  tripId,
  myParticipantId,
}: {
  tripId: string
  myParticipantId: string
}) {
  const supabase = await createClient()

  const [{ data: packlistAllRaw }, { data: shoppingAllRaw }] = await Promise.all([
    supabase.from('packlist_items').select('id').eq('trip_id', tripId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('shopping_items').select('id, is_bought').eq('trip_id', tripId),
  ])

  const allPacklistItems = (packlistAllRaw ?? []) as { id: string }[]
  const packlistTotal = allPacklistItems.length

  const packlistItemIds = allPacklistItems.map(i => i.id)
  const { data: checksRaw } = packlistItemIds.length > 0
    ? await supabase
        .from('packlist_checks')
        .select('item_id')
        .in('item_id', packlistItemIds)
        .eq('participant_id', myParticipantId)
    : { data: [] }

  const checkedCount = (checksRaw ?? []).length
  const packlistPct = packlistTotal > 0 ? Math.round((checkedCount / packlistTotal) * 100) : 0

  const allShoppingItems = (shoppingAllRaw ?? []) as { id: string; is_bought: boolean }[]
  const shoppingOpenCount = allShoppingItems.filter(s => !s.is_bought).length

  return (
    <div className="flex gap-2.5">
      <Link
        href={`/trips/${tripId}/packlist`}
        className="flex-1 bg-card rounded-[18px] card-shadow border border-border p-3.5 block active:opacity-85 transition-opacity"
      >
        <div className="text-[22px] mb-2">🎒</div>
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Packliste</div>
        <div className="text-[20px] font-black text-foreground tracking-tight mb-2">
          {checkedCount}/{packlistTotal}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${packlistPct}%` }} />
        </div>
        <div className="text-[10px] font-semibold text-muted-foreground mt-1.5">{packlistPct}% erledigt</div>
      </Link>

      <Link
        href={`/trips/${tripId}/einkauf`}
        className="flex-1 bg-card rounded-[18px] card-shadow border border-border p-3.5 block active:opacity-85 transition-opacity"
      >
        <div className="text-[22px] mb-2">🛒</div>
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Einkauf</div>
        <div className="text-[20px] font-black text-foreground tracking-tight mb-2">
          {shoppingOpenCount}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full" style={{ width: shoppingOpenCount > 0 ? '100%' : '0%' }} />
        </div>
        <div className="text-[10px] font-semibold text-muted-foreground mt-1.5">
          {shoppingOpenCount === 0 ? 'Alles erledigt' : 'Artikel noch offen'}
        </div>
      </Link>
    </div>
  )
}

export function PacklistShoppingCardsSkeleton() {
  return (
    <div className="flex gap-2.5">
      {[0, 1].map(i => (
        <div key={i} className="flex-1 bg-card rounded-[18px] card-shadow border border-border p-3.5">
          <div className="h-6 w-6 bg-muted animate-pulse rounded mb-2" />
          <div className="h-3 w-14 bg-muted animate-pulse rounded mb-1" />
          <div className="h-6 w-10 bg-muted animate-pulse rounded mb-2" />
          <div className="h-1.5 bg-muted animate-pulse rounded-full" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded mt-1.5" />
        </div>
      ))}
    </div>
  )
}
