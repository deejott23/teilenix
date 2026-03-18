'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tag, Plus, X } from 'lucide-react'

export interface CustomCategory {
  key: string
  emoji: string
  label: string
}

const STANDARD_CATEGORIES = [
  { key: 'food',          label: 'Essen & Trinken',  emoji: '🍽️' },
  { key: 'transport',     label: 'Transport',         emoji: '🚗' },
  { key: 'accommodation', label: 'Unterkunft',        emoji: '🏠' },
  { key: 'activities',    label: 'Aktivitäten',       emoji: '🎡' },
  { key: 'shopping',      label: 'Einkauf',           emoji: '🛍️' },
  { key: 'health',        label: 'Gesundheit',        emoji: '💊' },
  { key: 'other',         label: 'Sonstiges',         emoji: '📦' },
]

const EMOJI_SUGGESTIONS = ['🎵', '🎨', '🏋️', '🚀', '🎯', '🌴', '🍕', '🎭', '⛽', '🎪', '🧳', '🔧', '💡', '🎁', '🌊']

function parseCustomCategories(raw: string[]): CustomCategory[] {
  return raw.flatMap(s => {
    try { return [JSON.parse(s) as CustomCategory] } catch { return [] }
  })
}

interface TripCategorySettingsProps {
  tripId: string
  enabledCategories: string[]
  customCategories: string[]
  isActive: boolean
}

export default function TripCategorySettings({
  tripId,
  enabledCategories: initialEnabled,
  customCategories: initialCustomRaw,
  isActive,
}: TripCategorySettingsProps) {
  const router = useRouter()
  const [enabled, setEnabled] = useState<Set<string>>(new Set(initialEnabled))
  const [custom, setCustom] = useState<CustomCategory[]>(() => parseCustomCategories(initialCustomRaw))
  const [saving, setSaving] = useState(false)

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmoji, setNewEmoji] = useState('🎯')
  const [newLabel, setNewLabel] = useState('')

  const save = async (nextEnabled: Set<string>, nextCustom: CustomCategory[]) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabledCategories: [...nextEnabled],
          customCategories: nextCustom.map(c => JSON.stringify(c)),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern')
      throw e
    } finally {
      setSaving(false)
    }
  }

  const toggleStandard = async (key: string) => {
    if (!isActive || key === 'other') return
    const next = new Set(enabled)
    if (next.has(key)) {
      const customKeys = custom.map(c => c.key)
      const totalEnabled = [...next].filter(k => next.has(k)).length
      if (totalEnabled <= 1) { toast.error('Mindestens eine Kategorie muss aktiv sein'); return }
      next.delete(key)
    } else {
      next.add(key)
    }
    setEnabled(next)
    try { await save(next, custom) } catch { setEnabled(enabled) }
  }

  const addCustom = async () => {
    if (!newLabel.trim()) { toast.error('Bitte einen Namen eingeben'); return }
    const key = `cust_${Date.now()}`
    const newCat: CustomCategory = { key, emoji: newEmoji, label: newLabel.trim() }
    const nextCustom = [...custom, newCat]
    const nextEnabled = new Set([...enabled, key])
    setCustom(nextCustom)
    setEnabled(nextEnabled)
    setNewLabel('')
    setNewEmoji('🎯')
    setShowAddForm(false)
    try { await save(nextEnabled, nextCustom) } catch {
      setCustom(custom)
      setEnabled(enabled)
    }
  }

  const deleteCustom = async (key: string) => {
    const nextCustom = custom.filter(c => c.key !== key)
    const nextEnabled = new Set([...enabled].filter(k => k !== key))
    setCustom(nextCustom)
    setEnabled(nextEnabled)
    try { await save(nextEnabled, nextCustom) } catch {
      setCustom(custom)
      setEnabled(enabled)
    }
  }

  return (
    <div className="bg-card card-shadow rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Tag className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
        <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex-1">Kategorien</h2>
        {isActive && (
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            Eigene
          </button>
        )}
      </div>

      {!isActive && (
        <p className="px-4 py-3 text-xs text-muted-foreground">Kategorien können nur bei aktiven Reisen geändert werden.</p>
      )}

      {/* Standard categories */}
      <div className="divide-y divide-border/50">
        {STANDARD_CATEGORIES.map(cat => {
          const isEnabled = enabled.has(cat.key)
          const isFixed = cat.key === 'other'
          return (
            <button
              key={cat.key}
              onClick={() => toggleStandard(cat.key)}
              disabled={saving || isFixed || !isActive}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 disabled:cursor-default"
            >
              <span className="text-xl w-8 text-center flex-shrink-0">{cat.emoji}</span>
              <span className={`flex-1 text-sm font-medium ${isEnabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                {cat.label}
              </span>
              {isFixed ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-10 h-6 rounded-full bg-muted flex items-center px-0.5 opacity-40">
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm translate-x-4" />
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 font-medium">immer aktiv</span>
                </div>
              ) : (
                <div className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-0.5 ${isEnabled ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Custom categories */}
      {custom.length > 0 && (
        <div className="border-t border-border divide-y divide-border/50">
          {custom.map(cat => (
            <div key={cat.key} className="flex items-center gap-3 px-4 py-3.5">
              <span className="text-xl w-8 text-center flex-shrink-0">{cat.emoji}</span>
              <span className="flex-1 text-sm font-medium text-foreground">{cat.label}</span>
              <span className="text-[10px] text-primary font-semibold px-2 py-0.5 rounded-full bg-primary/10 mr-2">eigene</span>
              {isActive && (
                <button
                  onClick={() => deleteCustom(cat.key)}
                  disabled={saving}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add custom category form */}
      {showAddForm && isActive && (
        <div className="border-t border-border bg-muted/30 p-4 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Neue Kategorie</p>

          {/* Emoji picker */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Emoji wählen</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_SUGGESTIONS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setNewEmoji(e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    newEmoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {e}
                </button>
              ))}
              {/* Custom emoji input */}
              <input
                type="text"
                value={!EMOJI_SUGGESTIONS.includes(newEmoji) ? newEmoji : ''}
                onChange={e => setNewEmoji(e.target.value.slice(-2) || newEmoji)}
                placeholder="✏️"
                className="w-9 h-9 rounded-lg bg-muted text-center text-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Label input */}
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
              {newEmoji}
            </div>
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Kategoriename…"
              maxLength={30}
              className="flex-1 h-10 px-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={e => e.key === 'Enter' && addCustom()}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={addCustom}
              disabled={saving || !newLabel.trim()}
              className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 transition-opacity"
            >
              Hinzufügen
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewLabel(''); setNewEmoji('🎯') }}
              className="px-4 h-9 rounded-xl bg-muted text-sm font-semibold text-muted-foreground"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
