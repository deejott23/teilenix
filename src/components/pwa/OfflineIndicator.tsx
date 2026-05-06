'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { processQueue, getQueueLength } from '@/lib/offline-queue'

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const isOffline = !navigator.onLine
    setOffline(isOffline)
    if (isOffline) setPendingCount(getQueueLength())

    const handleOffline = () => {
      setOffline(true)
      setPendingCount(getQueueLength())
    }

    const handleOnline = async () => {
      const count = getQueueLength()
      setOffline(false)
      if (count > 0) {
        setSyncing(true)
        const { succeeded } = await processQueue()
        setSyncing(false)
        if (succeeded > 0) {
          toast.success(`${succeeded} Ausgabe${succeeded > 1 ? 'n' : ''} synchronisiert ✓`)
        }
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (syncing) {
    return (
      <div className="fixed top-0 inset-x-0 z-[300] flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white text-[12px] font-semibold">
        <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
        <span>Synchronisiere Daten…</span>
      </div>
    )
  }

  if (!offline) return null

  return (
    <div className="fixed top-0 inset-x-0 z-[300] flex items-center justify-center gap-2 py-2 px-4 bg-red-600 text-white text-[12px] font-semibold">
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
      <span>
        {pendingCount > 0
          ? `Kein Internet — ${pendingCount} Eingabe${pendingCount > 1 ? 'n' : ''} gespeichert, wird synchronisiert sobald Verbindung besteht`
          : 'Kein Internet — Eingaben werden gespeichert und synchronisiert'}
      </span>
    </div>
  )
}
