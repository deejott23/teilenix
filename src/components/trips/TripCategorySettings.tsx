'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tag, Plus, X, Pencil, Check } from 'lucide-react'

export interface CustomCategory {
  key: string
  emoji: string
  label: string
  isOverride?: boolean // true = renames a standard category
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

  // Inline edit state
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editEmoji, setEditEmoji] = useState('')
  const [editLabel, setEditLabel] = useState('')

  // Override map: standard category key → override entry
  const overrideMap = new Map(custom.filter(c => c.isOverride).map(c => [c.key, c]))
  // True custom categories (not overrides)
  const trueCustom = custom.filter(c => !c.isOverride)

  const startEdit = (key: string, emoji: string, label: string) => {
    setEditingKey(key)
    setEditEmoji(emoji)
    setEditLabel(label)
    setShowAddForm(false)
  }

  const cancelEdit = () => { setEditingKey(null); setEditEmoji(''); setEditLabel('') }

  const saveEdit = async () => {
    if (!editLabel.trim() || !editingKey) return
    const isStandard = STANDARD_CATEGORIES.some(c => c.key === editingKey)
    let nextCustom: CustomCategory[]
    if (isStandard) {
      // Upsert override for this standard category
      const existing = custom.filter(c => c.key !== editingKey)
      nextCustom = [...existing, { key: editingKey, emoji: editEmoji, label: editLabel.trim(), isOverride: true }]
    } else {
      nextCustom = custom.map(c => c.key === editingKey ? { ...c, emoji: editEmoji, label: editLabel.trim() } : c)
    }
    setCustom(nextCustom)
    cancelEdit()
    try { await save(enabled, nextCustom) } catch { setCustom(custom) }
  }

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

  const resetStandardLabel = async (key: string) => {
    const nextCustom = custom.filter(c => c.key !== key)
    setCustom(nextCustom)
    cancelEdit()
    try { await save(enabled, nextCustom) } catch { setCustom(custom) }
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

      {/* Inline edit form (shared for standard + custom) */}
      {editingKey && isActive && (() => {
        const isStandard = STANDARD_CATEGORIES.some(c => c.key === editingKey)
        return (
          <div className="border-b border-border bg-muted/30 px-4 py-3 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Umbenennen</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_SUGGESTIONS.map(e => (
                <button key={e} type="button" onClick={() => setEditEmoji(e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${editEmoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'}`}
                >{e}</button>
              ))}
              <input type="text" value={!EMOJI_SUGGESTIONS.includes(editEmoji) ? editEmoji : ''}
                onChange={e => setEditEmoji(e.target.value.slice(-2) || editEmoji)}
                placeholder="✏️"
                className="w-9 h-9 rounded-lg bg-muted text-center text-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">{editEmoji}</div>
              <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)}
                maxLength={30} autoFocus
                className="flex-1 h-10 px-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving || !editLabel.trim()}
                className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              ><Check className="w-4 h-4 inline mr-1" strokeWidth={2.5} />Speichern</button>
              {isStandard && overrideMap.has(editingKey) && (
                <button onClick={() => resetStandardLabel(editingKey)} disabled={saving}
                  className="px-3 h-9 rounded-xl bg-muted text-xs font-semibold text-muted-foreground"
                >Zurücksetzen</button>
              )}
              <button onClick={cancelEdit}
                className="px-4 h-9 rounded-xl bg-muted text-sm font-semibold text-muted-foreground"
              >Abbrechen</button>
            </div>
          </div>
        )
      })()}

      {/* Standard categories */}
      <div className="divide-y divide-border/50">
        {STANDARD_CATEGORIES.map(cat => {
          const override = overrideMap.get(cat.key)
          const displayEmoji = override?.emoji ?? cat.emoji
          const displayLabel = override?.label ?? cat.label
          const isEnabled = enabled.has(cat.key)
          const isFixed = cat.key === 'other'
          const isEditing = editingKey === cat.key
          return (
            <div key={cat.key} className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${!isFixed && isActive ? 'hover:bg-muted/40' : ''} ${isEditing ? 'bg-muted/20' : ''}`}>
              <button
                onClick={() => toggleStandard(cat.key)}
                disabled={saving || isFixed || !isActive}
                className="flex items-center gap-3 flex-1 text-left disabled:cursor-default min-w-0"
              >
                <span className="text-xl w-8 text-center flex-shrink-0">{displayEmoji}</span>
                <span className={`flex-1 text-sm font-medium truncate ${isEnabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                  {displayLabel}
                  {override && <span className="ml-1.5 text-[10px] text-primary/60 font-normal">(umbenannt)</span>}
                </span>
              </button>
              {isActive && !isFixed && (
                <button
                  onClick={() => isEditing ? cancelEdit() : startEdit(cat.key, displayEmoji, displayLabel)}
                  className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${isEditing ? 'bg-primary/10 text-primary' : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted'}`}
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              )}
              {isFixed ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-10 h-6 rounded-full bg-muted flex items-center px-0.5 opacity-40">
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm translate-x-4" />
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 font-medium">immer aktiv</span>
                </div>
              ) : (
                <button
                  onClick={() => toggleStandard(cat.key)}
                  disabled={saving || !isActive}
                  className="flex-shrink-0"
                >
                  <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${isEnabled ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Custom categories */}
      {trueCustom.length > 0 && (
        <div className="border-t border-border divide-y divide-border/50">
          {trueCustom.map(cat => {
            const isEditing = editingKey === cat.key
            return (
              <div key={cat.key} className={`flex items-center gap-3 px-4 py-3.5 ${isEditing ? 'bg-muted/20' : ''}`}>
                <span className="text-xl w-8 text-center flex-shrink-0">{cat.emoji}</span>
                <span className="flex-1 text-sm font-medium text-foreground truncate">{cat.label}</span>
                <span className="text-[10px] text-primary font-semibold px-2 py-0.5 rounded-full bg-primary/10 flex-shrink-0">eigene</span>
                {isActive && (
                  <>
                    <button
                      onClick={() => isEditing ? cancelEdit() : startEdit(cat.key, cat.emoji, cat.label)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${isEditing ? 'bg-primary/10 text-primary' : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted'}`}
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => deleteCustom(cat.key)}
                      disabled={saving}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </>
                )}
              </div>
            )
          })}
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
