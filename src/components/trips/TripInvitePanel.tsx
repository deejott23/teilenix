'use client'

import { useState } from 'react'
import { Copy, Check, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface TripInvitePanelProps {
  inviteCode: string
  tripId: string
}

export default function TripInvitePanel({ inviteCode, tripId }: TripInvitePanelProps) {
  const [copied, setCopied] = useState(false)
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${inviteCode}`
    : `/join/${inviteCode}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    toast.success('Link kopiert!')
    setTimeout(() => setCopied(false), 2000)
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(inviteCode)
    toast.success('Code kopiert!')
  }

  return (
    <div className="bg-gradient-to-r from-primary/5 to-emerald-50 border border-primary/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Einladungscode</p>
          <button
            onClick={copyCode}
            className="font-mono text-xl font-bold tracking-widest text-primary hover:text-primary/80 transition-colors"
          >
            {inviteCode}
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyLink}
            className="gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
            {copied ? 'Kopiert!' : 'Link teilen'}
          </Button>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Teile den Code oder Link mit deinen Mitreisenden. Sie brauchen nur ein Google-Konto.
      </p>
    </div>
  )
}
