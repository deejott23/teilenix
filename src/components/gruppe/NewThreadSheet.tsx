'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, ChevronRight } from 'lucide-react'
import type { LinkedType } from '@/types/app'

interface LinkedItem {
  id: string
  title: string
  subtitle: string
  emoji: string
}

interface Props {
  tripId: string
  onClose: () => void
  // Pre-loaded items to link
  activities: LinkedItem[]
  expenses: LinkedItem[]
  packlistItems: LinkedItem[]
  shoppingItems: LinkedItem[]
}

type Step = 'form' | 'pick-type' | 'pick-item'

const TYPE_LABELS: Record<LinkedType, string> = {
  activity: '✈️ Ausflug',
  expense: '💶 Ausgabe',
  packlist_item: '🎒 Packliste',
  shopping_item: '🛒 Einkaufszettel',
}

const TYPE_BG: Record<LinkedType, string> = {
  activity: 'bg-teal-50 text-teal-700',
  expense: 'bg-green-50 text-green-700',
  packlist_item: 'bg-blue-50 text-blue-700',
  shopping_item: 'bg-amber-50 text-amber-700',
}

export default function NewThreadSheet({
  tripId, onClose,
  activities, expenses, packlistItems, shoppingItems,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [title, setTitle] = useState('')
  const [linkedType, setLinkedType] = useState<LinkedType | null>(null)
  const [linkedItem, setLinkedItem] = useState<LinkedItem | null>(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const itemsForType = (type: LinkedType): LinkedItem[] => {
    if (type === 'activity') return activities
    if (type === 'expense') return expenses
    if (type === 'packlist_item') return packlistItems
    return shoppingItems
  }

  async function submit() {
    if (!title.trim()) { toast.error('Titel eingeben'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          linked_type: linkedType ?? null,
          linked_id: linkedItem?.id ?? null,
          linked_title: linkedItem?.title ?? null,
          linked_subtitle: linkedItem?.subtitle ?? null,
          linked_emoji: linkedItem?.emoji ?? null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const thread = await res.json()
      router.push(`/trips/${tripId}/gruppe/${thread.id}`)
      router.refresh()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full bg-card rounded-t-[24px] shadow-2xl max-h-[85vh] flex flex-col">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-[15px] font-bold text-foreground">
            {step === 'form' ? 'Neues Thema' : step === 'pick-type' ? 'Verknüpfen mit…' : `${TYPE_LABELS[linkedType!]} wählen`}
          </h2>
          <button onClick={step === 'form' ? onClose : () => setStep('form')} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── Step: Form ── */}
        {step === 'form' && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Title */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Thema</label>
              <input
                ref={inputRef}
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="z.B. Ausflug Palma, Abrechnung Bootstour…"
                className="w-full bg-muted rounded-[14px] px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none border border-transparent focus:border-primary/40"
                onKeyDown={e => e.key === 'Enter' && submit()}
              />
            </div>

            {/* Link */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Verknüpfen (optional)</label>
              {linkedItem ? (
                <div className="flex items-center gap-3 bg-primary/8 border border-primary/20 rounded-[14px] px-4 py-3">
                  <span className="text-[22px]">{linkedItem.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-primary">{TYPE_LABELS[linkedType!]}</div>
                    <div className="text-[13px] font-semibold text-foreground truncate">{linkedItem.title}</div>
                  </div>
                  <button onClick={() => { setLinkedItem(null); setLinkedType(null) }} className="w-6 h-6 flex items-center justify-center rounded-full bg-muted">
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setStep('pick-type')}
                  className="w-full flex items-center gap-3 bg-muted rounded-[14px] px-4 py-3 text-[13px] text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <span className="text-[20px]">🔗</span>
                  <span className="flex-1 text-left">Ausflug, Ausgabe, Packliste…</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={submit}
              disabled={saving || !title.trim()}
              className="w-full py-3.5 rounded-[14px] bg-primary text-primary-foreground font-bold text-[14px] disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {saving ? 'Erstelle…' : 'Thema erstellen'}
            </button>
          </div>
        )}

        {/* ── Step: Pick type ── */}
        {step === 'pick-type' && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {(Object.keys(TYPE_LABELS) as LinkedType[]).map(type => (
              <button
                key={type}
                onClick={() => { setLinkedType(type); setStep('pick-item') }}
                className="w-full flex items-center gap-3 bg-muted rounded-[16px] px-4 py-3.5 hover:bg-muted/80 transition-colors"
              >
                <span className="text-[22px]">{TYPE_LABELS[type].split(' ')[0]}</span>
                <span className="flex-1 text-left text-[14px] font-semibold text-foreground">{TYPE_LABELS[type].split(' ').slice(1).join(' ')}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {/* ── Step: Pick item ── */}
        {step === 'pick-item' && linkedType && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {itemsForType(linkedType).length === 0 ? (
              <p className="text-center text-[13px] text-muted-foreground py-8">Keine Einträge vorhanden</p>
            ) : (
              itemsForType(linkedType).map(item => (
                <button
                  key={item.id}
                  onClick={() => { setLinkedItem(item); setStep('form') }}
                  className="w-full flex items-center gap-3 bg-muted rounded-[16px] px-4 py-3 hover:bg-muted/80 transition-colors"
                >
                  <div className="w-10 h-10 rounded-[12px] bg-card flex items-center justify-center text-[20px] flex-shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[13px] font-bold text-foreground truncate">{item.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.subtitle}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  )
}
