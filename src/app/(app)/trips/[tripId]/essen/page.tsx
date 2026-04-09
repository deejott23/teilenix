import TripSubNav from '@/components/layout/TripSubNav'

export default async function EssenPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params

  return (
    <>
      <TripSubNav tripId={tripId} tabs={[
        { href: '/planen', label: '✈️ Ausflüge' },
        { href: '/essen',  label: '🍽️ Essen' },
      ]} />

      <div className="space-y-4">
        <div className="text-center py-2">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
            Bald verfügbar ✨
          </span>
        </div>

        <div className="bg-card rounded-[20px] card-shadow overflow-hidden">
          <div className="h-28 flex items-center justify-center relative"
            style={{ background: 'linear-gradient(135deg, #fef3e2 0%, #c47a1e 100%)' }}>
            <span className="text-[56px]">🍽️</span>
          </div>
          <div className="p-4">
            <h2 className="text-[16px] font-bold text-foreground mb-1">Restaurant & Mahlzeiten</h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
              Plant gemeinsam Restaurants, Abendessen und Mahlzeiten. Sammelt Empfehlungen, stimmt ab und bucht Tische — alles an einem Ort.
            </p>
            <div className="flex flex-wrap gap-2">
              {['🍕 Restaurants', '⭐ Empfehlungen', '📅 Reservierungen', '🗳️ Abstimmen'].map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[12px] text-muted-foreground/60 pb-2">
          Wir arbeiten daran — sei gespannt! 🚀
        </p>
      </div>
    </>
  )
}
