'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setOffline(!navigator.onLine)

    const handleOffline = () => setOffline(true)
    const handleOnline = () => setOffline(false)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 inset-x-0 z-[300] flex items-center justify-center gap-2 py-2 px-4 bg-red-600 text-white text-[12px] font-semibold">
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Kein Internet — Eingaben werden gespeichert und synchronisiert</span>
    </div>
  )
}
