'use client'

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'linear-gradient(150deg, #1E6FD9 0%, #1859B5 100%)' }}
    >
      <div className="text-6xl mb-6">✈️</div>
      <h1 className="text-2xl font-bold text-white mb-3">Kein Internet</h1>
      <p className="text-white/60 text-sm max-w-xs leading-relaxed mb-8">
        Du bist gerade offline. Bitte überprüfe deine Internetverbindung und lade die Seite erneut.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-2xl font-semibold text-sm"
        style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        Erneut versuchen
      </button>
    </div>
  )
}
