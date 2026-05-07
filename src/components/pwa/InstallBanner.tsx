'use client'

import { useEffect, useState } from 'react'
import { X, Share, Plus } from 'lucide-react'

const VISIT_KEY = 'pwa-visit-count'
const DISMISSED_KEY = 'pwa-install-dismissed'
const SHOW_AFTER_VISITS = 3

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show on iOS Safari, not in standalone mode
    if (!isIOS() || isInStandaloneMode()) return

    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (dismissed) return

    // Increment visit counter
    const visits = parseInt(localStorage.getItem(VISIT_KEY) ?? '0', 10) + 1
    localStorage.setItem(VISIT_KEY, String(visits))

    if (visits >= SHOW_AFTER_VISITS) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-20 z-[200] px-4 pointer-events-none">
      <div
        className="bg-card rounded-[20px] shadow-2xl border border-border p-4 pointer-events-auto"
        style={{ boxShadow: '0 -2px 40px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sharepa-app-icon-192.png"
              alt="share|pa"
              className="w-10 h-10 rounded-[10px] flex-shrink-0"
            />
            <div>
              <div className="text-[14px] font-bold text-foreground leading-tight">share|pa installieren</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Zum Homescreen hinzufügen</div>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground flex-shrink-0 -mt-0.5 -mr-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
          Installiere share|pa auf deinem Homescreen — kein App Store, öffnet wie eine echte App.
        </p>

        {/* Steps */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 bg-muted/60 rounded-[12px] px-3 py-2.5">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-primary">1</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-[12px] text-foreground">Tippe auf</span>
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 rounded-[6px] flex-shrink-0">
                <Share className="w-3.5 h-3.5 text-white" />
              </span>
              <span className="text-[12px] text-foreground">in Safari</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-muted/60 rounded-[12px] px-3 py-2.5">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-primary">2</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-[12px] text-foreground">Wähle</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted border border-border rounded-[6px]">
                <Plus className="w-3 h-3 text-foreground" />
                <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">Zum Home-Bildschirm</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={dismiss}
          className="mt-3 w-full py-2.5 rounded-[12px] text-[12px] font-semibold text-muted-foreground"
        >
          Nicht jetzt
        </button>
      </div>
    </div>
  )
}
