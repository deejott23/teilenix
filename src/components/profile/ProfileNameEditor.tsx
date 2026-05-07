'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'

export default function ProfileNameEditor({ displayName }: { displayName: string }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(displayName)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (trimmed === displayName) { setEditing(false); return }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: trimmed }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      toast.success('Name aktualisiert')
      router.refresh()
      setEditing(false)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setName(displayName)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') cancel()
          }}
          maxLength={50}
          className="h-9 text-sm flex-1"
        />
        <button
          onClick={save}
          disabled={saving || !name.trim()}
          className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
        >
          <Check className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button
          onClick={cancel}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <p className="text-sm font-medium text-foreground flex-1">{displayName}</p>
      <button
        onClick={() => setEditing(true)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/8 transition-colors opacity-0 group-hover:opacity-100"
        title="Name bearbeiten"
      >
        <Icon name="edit" size={14} />
      </button>
    </div>
  )
}
