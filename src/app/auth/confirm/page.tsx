import { Suspense } from 'react'
import ConfirmClient from './ConfirmClient'

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(160deg, #0d1a19 0%, #111b2a 50%, #0f1520 100%)',
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Anmeldung wird abgeschlossen…</p>
        </div>
      }
    >
      <ConfirmClient />
    </Suspense>
  )
}
