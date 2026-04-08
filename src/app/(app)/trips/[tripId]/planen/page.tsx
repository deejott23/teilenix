export default function PlanenPage() {
  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
          Bald verfügbar ✨
        </span>
      </div>

      {/* Ausflüge */}
      <div className="bg-card rounded-[20px] card-shadow overflow-hidden">
        <div className="h-28 flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)' }}>
          <span className="text-[56px]">🗺️</span>
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/30 text-white backdrop-blur-sm">
            Coming Soon
          </span>
        </div>
        <div className="p-4">
          <h2 className="text-[16px] font-bold text-foreground mb-1">Ausflüge planen</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
            Macht gemeinsam Vorschläge, stimmt ab wo ihr hinwollt und plant alle Details: Abfahrt, Treffpunkt, Kosten und wer mitkommt.
          </p>
          <div className="flex flex-wrap gap-2">
            {['🗳️ Abstimmung', '📍 Treffpunkt', '⛵ Details', '👥 Wer kommt'].map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Essenplanung */}
      <div className="bg-card rounded-[20px] card-shadow overflow-hidden">
        <div className="h-28 flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #ec4899 100%)' }}>
          <span className="text-[56px]">🍽️</span>
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/30 text-white backdrop-blur-sm">
            Coming Soon
          </span>
        </div>
        <div className="p-4">
          <h2 className="text-[16px] font-bold text-foreground mb-1">Essenplanung</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
            Plant gemeinsam wer wann kocht, welches Restaurant ihr besucht oder wer was mitbringt. Für jeden Reisetag ein Plan.
          </p>
          <div className="flex flex-wrap gap-2">
            {['📅 Tagesplan', '🍳 Kochplan', '🍕 Restaurant', '🛒 Einkauf'].map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">
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
  )
}
