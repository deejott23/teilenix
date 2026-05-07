'use client'

import { useState } from 'react'
import { Copy, Check, Mail, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

interface TripInvitePanelProps {
  inviteCode: string
  tripName: string
}

export default function TripInvitePanel({ inviteCode, tripName }: TripInvitePanelProps) {
  const [copied, setCopied] = useState(false)

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${inviteCode}`
    : `/join/${inviteCode}`

  const emailSubject = encodeURIComponent(`Einladung zur Reise: ${tripName}`)
  const emailBody = encodeURIComponent(
    `Hallo!\n\nIch lade dich ein, an unserer Reise "${tripName}" in share|pa teilzunehmen.\n\nKlick einfach auf diesen Link:\n${joinUrl}\n\nOder gib den Code ${inviteCode} direkt in der App ein.\n\nBis bald!`
  )
  const whatsappText = encodeURIComponent(`Hey! Komm bei unserer Reise "${tripName}" mit 🗺️ Klick hier: ${joinUrl}`)

  const copyLink = async () => {
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    toast.success('Link kopiert!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-[18px] card-shadow p-5 space-y-4">
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Einladung</p>

        {/* Code + copy */}
        <div className="flex items-center justify-between gap-3 bg-muted rounded-2xl px-4 py-3">
          <button onClick={copyLink} className="font-mono text-2xl font-bold tracking-[0.15em] text-foreground hover:text-primary transition-colors">
            {inviteCode}
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl card-shadow text-sm font-semibold text-foreground hover:text-primary transition-colors flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Kopiert!' : 'Kopieren'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
          className="flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 rounded-2xl px-3 py-2.5 text-sm font-semibold text-sky-700 transition-colors"
        >
          <Mail className="w-4 h-4" strokeWidth={2} />
          Per E-Mail
        </a>
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 rounded-2xl px-3 py-2.5 text-sm font-semibold text-emerald-700 transition-colors"
        >
          <MessageCircle className="w-4 h-4" strokeWidth={2} />
          WhatsApp
        </a>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Jeder mit dem Link kann beitreten und seinen Gruppenanteil festlegen.
      </p>
    </div>
  )
}
