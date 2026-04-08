export default function GruppePage() {
  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-700">
          Bald verfügbar ✨
        </span>
      </div>

      {/* Gruppen-Chat */}
      <div className="bg-card rounded-[20px] card-shadow overflow-hidden">
        <div className="h-28 flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #cffafe 0%, #06b6d4 100%)' }}>
          <span className="text-[56px]">💬</span>
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/30 text-white backdrop-blur-sm">
            Coming Soon
          </span>
        </div>
        <div className="p-4">
          <h2 className="text-[16px] font-bold text-foreground mb-1">Gruppen-Chat</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
            Tauscht euch direkt in der App aus. Stellt Fragen, teilt Ideen und koordiniert euch — alles an einem Ort, ohne WhatsApp-Chaos.
          </p>
          <div className="flex flex-wrap gap-2">
            {['💬 Nachrichten', '📎 Anhänge', '🔔 Benachrichtigungen', '📌 Pinnen'].map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Gemeinsame Notizen */}
      <div className="bg-card rounded-[20px] card-shadow overflow-hidden">
        <div className="h-28 flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #8b5cf6 100%)' }}>
          <span className="text-[56px]">📝</span>
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/30 text-white backdrop-blur-sm">
            Coming Soon
          </span>
        </div>
        <div className="p-4">
          <h2 className="text-[16px] font-bold text-foreground mb-1">Gemeinsame Notizen</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
            Ein geteiltes Notizbuch für die Gruppe. Wichtige Infos, Adressen, Passwörter für Ferienhäuser — alles für alle sichtbar.
          </p>
          <div className="flex flex-wrap gap-2">
            {['📋 Notizen', '🔗 Links', '📍 Adressen', '🔑 Zugänge'].map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200">
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
