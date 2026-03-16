'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function FamilyInviteCode({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    toast.success('Einladungscode kopiert!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card card-shadow rounded-2xl p-4">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
        Einladungscode
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted rounded-xl py-3 px-4 text-center">
          <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
            {inviteCode}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="gap-1.5 flex-shrink-0"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Kopiert' : 'Kopieren'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground/60 mt-2">
        Teile diesen Code, damit weitere Mitglieder deiner Abrechnungsgruppe beitreten können.
      </p>
    </div>
  )
}
