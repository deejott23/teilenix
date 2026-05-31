export default function LinkErrorPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #0d1a19 0%, #111b2a 50%, #0f1520 100%)' }}
    >
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-[40px]">⚠️</div>
        <h1 className="text-[20px] font-bold" style={{ color: '#f0ede6' }}>Link abgelaufen</h1>
        <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Der Link ist abgelaufen oder wurde bereits verwendet.
          Öffne den Link auf demselben Gerät und im gleichen Browser,
          in dem du ihn angefordert hast – oder fordere einen neuen an.
        </p>
        <a
          href="/login"
          className="block w-full py-3 rounded-[14px] font-bold text-[15px] text-center"
          style={{
            background: 'rgba(255,255,255,0.09)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          Neuen Link anfordern
        </a>
      </div>
    </div>
  )
}
