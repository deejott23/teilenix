'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Mail, X, ArrowRight } from 'lucide-react'

export default function JoinWithCodeButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    router.push(`/join/${trimmed}`)
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl border text-sm font-semibold transition-all ${
          open
            ? 'border-primary/30 bg-primary/8 text-primary'
            : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
        }`}
      >
        <Mail className="w-4 h-4" strokeWidth={1.8} />
        Einladung erhalten?
      </button>

      {open && (
        <div className="bg-card rounded-2xl border border-border p-3.5 space-y-2.5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Einladungscode aus der Reise-Einladung eingeben:
          </p>
          <div className="flex gap-2">
            <Input
              autoFocus
              placeholder="z.B. AB12CD34"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={12}
              className="font-mono tracking-widest text-sm h-10 flex-1"
            />
            <button
              onClick={handleJoin}
              disabled={!code.trim()}
              className="px-3.5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity flex-shrink-0 flex items-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
            </button>
            <button
              onClick={() => { setOpen(false); setCode('') }}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
