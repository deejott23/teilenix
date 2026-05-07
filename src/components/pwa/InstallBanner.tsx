'use client'

import { useEffect, useState } from 'react'
import { X, Share, Plus } from 'lucide-react'

// Android: sofort zeigen, bei Dismiss 7 Tage pausieren (kein Besuchs-Counter)
const ANDROID_SNOOZED_KEY = 'pwa-android-snoozed-until'
const ANDROID_INSTALLED_KEY = 'pwa-android-installed'
// iOS: nach 3 Besuchen zeigen, bei Dismiss permanent weg
const IOS_VISIT_KEY = 'pwa-ios-visit-count'
const IOS_DISMISSED_KEY = 'pwa-ios-dismissed'
const IOS_SHOW_AFTER = 3
const SNOOZE_DAYS = 7

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
}

export default function InstallBanner() {
  const [mode, setMode] = useState<'android' | 'ios' | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (isStandalone()) return

    // ── Android ──────────────────────────────────────────────────────────────
    const handler = (e: Event) => {
      e.preventDefault()
      if (localStorage.getItem(ANDROID_INSTALLED_KEY)) return
      const snoozedUntil = parseInt(localStorage.getItem(ANDROID_SNOOZED_KEY) ?? '0', 10)
      if (Date.now() < snoozedUntil) return
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setMode('android')
    }
    window.addEventListener('beforeinstallprompt', handler)

    // ── iOS ───────────────────────────────────────────────────────────────────
    if (isIOS()) {
      if (!localStorage.getItem(IOS_DISMISSED_KEY)) {
        const visits = parseInt(localStorage.getItem(IOS_VISIT_KEY) ?? '0', 10) + 1
        localStorage.setItem(IOS_VISIT_KEY, String(visits))
        if (visits >= IOS_SHOW_AFTER) setMode('ios')
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function snoozeAndroid() {
    const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000
    localStorage.setItem(ANDROID_SNOOZED_KEY, String(until))
    setMode(null)
  }

  function dismissIOS() {
    localStorage.setItem(IOS_DISMISSED_KEY, '1')
    setMode(null)
  }

  async function installAndroid() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') localStorage.setItem(ANDROID_INSTALLED_KEY, '1')
    setMode(null)
  }

  if (!mode) return null

  // ── Android: Sticky-Banner über der Tabbar ──────────────────────────────
  if (mode === 'android') {
    return (
      <div
        className="fixed inset-x-0 bottom-16 z-[200] mx-3 mb-1"
        style={{ filter: 'drop-shadow(0 -4px 20px rgba(27,92,88,0.25))' }}
      >
        <div
          className="rounded-[18px] p-3.5 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #1E6FD9 0%, #1859B5 100%)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sharepa-app-icon-petrol-192.png"
            alt="share|pa"
            className="w-10 h-10 rounded-[10px] flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white leading-tight">Als App speichern</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Kein App Store · Öffnet wie eine echte App
            </p>
          </div>
          <button
            onClick={installAndroid}
            className="flex-shrink-0 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            Installieren
          </button>
          <button
            onClick={snoozeAndroid}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.5)' }}
            aria-label="Schließen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // ── iOS: Modal-Card mit Anleitung ───────────────────────────────────────
  return (
    <div className="fixed inset-x-0 bottom-20 z-[200] px-4 pointer-events-none">
      <div
        className="bg-card rounded-[20px] shadow-2xl border border-border p-4 pointer-events-auto"
        style={{ boxShadow: '0 -2px 40px rgba(0,0,0,0.18)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sharepa-app-icon-petrol-192.png" alt="share|pa" className="w-10 h-10 rounded-[10px] flex-shrink-0" />
            <div>
              <div className="text-[14px] font-bold text-foreground leading-tight">share|pa installieren</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Zum Homescreen hinzufügen</div>
            </div>
          </div>
          <button onClick={dismissIOS} className="w-7 h-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
          Installiere share|pa auf deinem Homescreen — kein App Store, öffnet wie eine echte App.
        </p>

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

        <button onClick={dismissIOS} className="mt-3 w-full py-2.5 rounded-[12px] text-[12px] font-semibold text-muted-foreground">
          Nicht jetzt
        </button>
      </div>
    </div>
  )
}
