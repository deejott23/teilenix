'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QrCode, X } from 'lucide-react'

export default function JoinWithCodeButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    router.push(`/join/${trimmed}`)
  }

  if (!open) {
    return (
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 rounded-xl font-semibold text-xs"
        style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', boxShadow: 'none' }}
      >
        <QrCode className="w-3.5 h-3.5" strokeWidth={2.5} />
        Code eingeben
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        placeholder="z.B. AB12CD34"
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && handleJoin()}
        maxLength={12}
        className="h-8 w-32 rounded-xl text-xs font-mono tracking-widest text-foreground"
        style={{ background: 'rgba(255,255,255,0.9)', border: 'none' }}
      />
      <Button
        size="sm"
        onClick={handleJoin}
        disabled={!code.trim()}
        className="h-8 rounded-xl font-semibold text-xs"
        style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', boxShadow: 'none' }}
      >
        Beitreten
      </Button>
      <button
        onClick={() => { setOpen(false); setCode('') }}
        className="text-white/60 hover:text-white/90 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
