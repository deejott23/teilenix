'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePacklist } from '@/hooks/usePacklist'
import { queryKeys } from '@/lib/query/queryKeys'
import TripSubNav from '@/components/layout/TripSubNav'
import { toast } from 'sonner'
import { Plus, Minus, Check, X, ChevronDown, Users } from 'lucide-react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import type { PacklistItem, PacklistItemType, PacklistClaim, TripParticipant } from '@/types/app'

interface PacklistClientProps {
  tripId: string
  items: PacklistItem[]
  participants: TripParticipant[]
  myParticipantId: string
  myGroupId: string | null
  myGroupName: string | null
  isActive: boolean
}

type TabKey = 'bringing' | 'group_need'

const AV_COLORS = ['#1E6FD9', '#2d8a84', '#4ab5ae', '#c47a1e', '#6b4fa0', '#2d7a4f']
function avColor(id: string) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AV_COLORS[h % AV_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Compact checkbox ──────────────────────────────────────────────────────────
function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onToggle() }}
      className={cn(
        'w-5 h-5 rounded-[5px] border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all active:scale-90',
        checked ? 'bg-primary border-primary' : 'border-border'
      )}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  )
}

// ── Quantity stepper — same style as shopping list ───────────────────────────
function Stepper({ value, onMinus, onPlus, min = 1 }: { value: number; onMinus: () => void; onPlus: () => void; min?: number }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onMinus} disabled={value <= min}
        className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 active:scale-90 transition-all disabled:opacity-30">
        <Minus className="w-2.5 h-2.5" strokeWidth={2.5} />
      </button>
      <span className="w-5 text-center text-[13px] font-bold text-foreground tabular-nums">{value}</span>
      <button type="button" onClick={onPlus}
        className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 active:scale-90 transition-all">
        <Plus className="w-2.5 h-2.5" strokeWidth={2.5} />
      </button>
    </div>
  )
}

// ── Bringing item row ─────────────────────────────────────────────────────────
function BringingRow({
  item, myParticipantId, tripId, isActive,
}: {
  item: PacklistItem; myParticipantId: string; tripId: string; isActive: boolean
}) {
  const queryClient = useQueryClient()
  const key = queryKeys.packlist.byTrip(tripId)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMyItem = item.created_by_participant_id === myParticipantId

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const handleCheck = async () => {
    const prev = queryClient.getQueryData<PacklistItem[]>(key)
    queryClient.setQueryData<PacklistItem[]>(key, items =>
      items?.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i) ?? []
    )
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}/check`, { method: 'POST' })
    } catch {
      if (prev) queryClient.setQueryData(key, prev)
      toast.error('Fehler')
    } finally {
      queryClient.invalidateQueries({ queryKey: key })
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`"${item.title}" löschen?`)) return
    const prev = queryClient.getQueryData<PacklistItem[]>(key)
    queryClient.setQueryData<PacklistItem[]>(key, items => items?.filter(i => i.id !== item.id) ?? [])
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}`, { method: 'DELETE' })
      toast.success('Gelöscht')
    } catch {
      if (prev) queryClient.setQueryData(key, prev)
      toast.error('Fehler beim Löschen')
    } finally {
      queryClient.invalidateQueries({ queryKey: key })
    }
  }

  const handleEditSave = async () => {
    const trimmed = editTitle.trim()
    if (!trimmed || trimmed === item.title) { setEditing(false); setEditTitle(item.title); return }
    setSaving(true)
    const prev = queryClient.getQueryData<PacklistItem[]>(key)
    queryClient.setQueryData<PacklistItem[]>(key, items =>
      items?.map(i => i.id === item.id ? { ...i, title: trimmed } : i) ?? []
    )
    setEditing(false)
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
    } catch {
      if (prev) queryClient.setQueryData(key, prev)
      setEditing(true)
      setEditTitle(trimmed)
      toast.error('Fehler')
    } finally {
      setSaving(false)
      queryClient.invalidateQueries({ queryKey: key })
    }
  }

  return (
    <div className={cn(
      'flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border last:border-0',
      item.checked && 'opacity-60'
    )}>
      <Checkbox checked={item.checked} onToggle={handleCheck} />

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input ref={inputRef} value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') { setEditing(false); setEditTitle(item.title) } }}
              maxLength={100}
              className="flex-1 min-w-0 text-[13px] font-semibold bg-muted rounded-lg px-2 py-1 outline-none border border-primary/50 focus:border-primary" />
            <button type="button" onClick={handleEditSave} disabled={saving}
              className="w-6 h-6 flex items-center justify-center bg-primary text-white rounded-md disabled:opacity-50 flex-shrink-0">
              <Check className="w-3 h-3" strokeWidth={3} />
            </button>
            <button type="button" onClick={() => { setEditing(false); setEditTitle(item.title) }}
              className="w-6 h-6 flex items-center justify-center bg-muted text-muted-foreground rounded-md flex-shrink-0">
              <X className="w-3 h-3" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <span className={cn('text-[13px] font-semibold text-foreground', item.checked && 'line-through')}>
            {item.title}
          </span>
        )}
      </div>

      {isMyItem && isActive && !editing && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button type="button" onClick={() => setEditing(true)}
            className="p-1.5 text-muted-foreground/40 hover:text-primary rounded-lg transition-colors">
            <Icon name="edit" size={14} />
          </button>
          <button type="button" onClick={handleDelete}
            className="p-1.5 text-muted-foreground/40 hover:text-destructive rounded-lg transition-colors">
            <Icon name="delete" size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Group need item row ───────────────────────────────────────────────────────
function GroupNeedRow({
  item, myParticipantId, myParticipantName, myGroupId, myGroupName, tripId, isActive,
}: {
  item: PacklistItem; myParticipantId: string; myParticipantName: string
  myGroupId: string | null; myGroupName: string | null
  tripId: string; isActive: boolean
}) {
  const queryClient = useQueryClient()
  const key = queryKeys.packlist.byTrip(tripId)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMyItem = item.created_by_participant_id === myParticipantId

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const myClaim = item.claims.find(c => c.participant_id === myParticipantId)
  const totalClaimed = item.claims.reduce((s, c) => s + c.quantity_claimed, 0)
  const isCovered = totalClaimed >= item.quantity_needed

  const handleClaim = async () => {
    const prev = queryClient.getQueryData<PacklistItem[]>(key)
    queryClient.setQueryData<PacklistItem[]>(key, items =>
      items?.map(i => {
        if (i.id !== item.id) return i
        if (myClaim) {
          return { ...i, claims: i.claims.filter(c => c.participant_id !== myParticipantId) }
        } else {
          const newClaim: PacklistClaim = {
            id: `temp-${Date.now()}`,
            item_id: item.id,
            participant_id: myParticipantId,
            participant_name: myParticipantName,
            quantity_claimed: 1,
          }
          return { ...i, claims: [...i.claims, newClaim] }
        }
      }) ?? []
    )
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_claimed: myClaim ? null : 1 }),
      })
    } catch {
      if (prev) queryClient.setQueryData(key, prev)
      toast.error('Fehler')
    } finally {
      queryClient.invalidateQueries({ queryKey: key })
    }
  }

  const handleClaimQty = async (delta: number) => {
    const next = Math.max(1, Math.min(99, (myClaim?.quantity_claimed ?? 1) + delta))
    if (next === myClaim?.quantity_claimed) return
    const prev = queryClient.getQueryData<PacklistItem[]>(key)
    queryClient.setQueryData<PacklistItem[]>(key, items =>
      items?.map(i => {
        if (i.id !== item.id) return i
        return { ...i, claims: i.claims.map(c => c.participant_id === myParticipantId ? { ...c, quantity_claimed: next } : c) }
      }) ?? []
    )
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_claimed: next }),
      })
    } catch {
      if (prev) queryClient.setQueryData(key, prev)
      toast.error('Fehler')
    } finally {
      queryClient.invalidateQueries({ queryKey: key })
    }
  }

  const handleNeedQty = async (delta: number) => {
    const next = Math.max(1, Math.min(99, item.quantity_needed + delta))
    if (next === item.quantity_needed) return
    const prev = queryClient.getQueryData<PacklistItem[]>(key)
    queryClient.setQueryData<PacklistItem[]>(key, items =>
      items?.map(i => i.id === item.id ? { ...i, quantity_needed: next } : i) ?? []
    )
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_needed: next }),
      })
    } catch {
      if (prev) queryClient.setQueryData(key, prev)
      toast.error('Fehler')
    } finally {
      queryClient.invalidateQueries({ queryKey: key })
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`"${item.title}" löschen?`)) return
    const prev = queryClient.getQueryData<PacklistItem[]>(key)
    queryClient.setQueryData<PacklistItem[]>(key, items => items?.filter(i => i.id !== item.id) ?? [])
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}`, { method: 'DELETE' })
      toast.success('Gelöscht')
    } catch {
      if (prev) queryClient.setQueryData(key, prev)
      toast.error('Fehler')
    } finally {
      queryClient.invalidateQueries({ queryKey: key })
    }
  }

  const handleEditSave = async () => {
    const trimmed = editTitle.trim()
    if (!trimmed || trimmed === item.title) { setEditing(false); setEditTitle(item.title); return }
    setSaving(true)
    const prev = queryClient.getQueryData<PacklistItem[]>(key)
    queryClient.setQueryData<PacklistItem[]>(key, items =>
      items?.map(i => i.id === item.id ? { ...i, title: trimmed } : i) ?? []
    )
    setEditing(false)
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
    } catch {
      if (prev) queryClient.setQueryData(key, prev)
      setEditing(true)
      setEditTitle(trimmed)
      toast.error('Fehler')
    } finally {
      setSaving(false)
      queryClient.invalidateQueries({ queryKey: key })
    }
  }

  return (
    <div className="border-b border-border last:border-0">
      {/* Main row */}
      <button
        type="button"
        onClick={() => setExpanded(o => !o)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        {/* Status dot */}
        <div className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          isCovered ? 'bg-green-500' : totalClaimed > 0 ? 'bg-amber-400' : 'bg-muted-foreground/25'
        )} />

        {/* Title */}
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-semibold text-foreground">{item.title}</span>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isCovered ? (
            <span className="text-[11px] font-bold text-green-600">✓ gedeckt</span>
          ) : (
            <span className={cn('text-[11px] font-bold tabular-nums', totalClaimed > 0 ? 'text-amber-600' : 'text-muted-foreground/50')}>
              {totalClaimed}/{item.quantity_needed}×
            </span>
          )}
          {myClaim && (
            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-bold">ich dabei</span>
          )}
          <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-150', expanded && 'rotate-180')} strokeWidth={2} />
        </div>
      </button>

      {/* Expanded area */}
      {expanded && (
        <div className="px-3.5 pb-3 space-y-3">
          {/* Title edit for owner */}
          {isMyItem && isActive && (
            <div>
              {editing ? (
                <div className="flex items-center gap-1.5">
                  <input ref={inputRef} value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') { setEditing(false); setEditTitle(item.title) } }}
                    maxLength={100}
                    className="flex-1 min-w-0 text-[13px] font-semibold bg-muted rounded-lg px-2 py-1 outline-none border border-primary/50 focus:border-primary" />
                  <button type="button" onClick={handleEditSave} disabled={saving}
                    className="w-6 h-6 flex items-center justify-center bg-primary text-white rounded-md disabled:opacity-50 flex-shrink-0">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </button>
                  <button type="button" onClick={() => { setEditing(false); setEditTitle(item.title) }}
                    className="w-6 h-6 flex items-center justify-center bg-muted text-muted-foreground rounded-md flex-shrink-0">
                    <X className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setEditing(true)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
                    <Icon name="edit" size={12} />
                    Titel bearbeiten
                  </button>
                  <button type="button" onClick={handleDelete}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors ml-3">
                    <Icon name="delete" size={12} />
                    Löschen
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Needed quantity (owner only) */}
          {isMyItem && isActive && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-muted-foreground">Anzahl benötigt</span>
              <Stepper value={item.quantity_needed} onMinus={() => handleNeedQty(-1)} onPlus={() => handleNeedQty(+1)} />
            </div>
          )}

          {/* Progress bar */}
          {item.quantity_needed > 1 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalClaimed / item.quantity_needed) * 100)}%`, background: isCovered ? '#2d7a4f' : '#c47a1e' }} />
              </div>
              <span className={cn('text-[10px] font-bold flex-shrink-0', isCovered ? 'text-green-700' : 'text-amber-600')}>
                {totalClaimed}/{item.quantity_needed}
              </span>
            </div>
          )}

          {/* Who's claimed */}
          {item.claims.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.claims.map(c => (
                <div key={c.participant_id} className="flex items-center gap-1 bg-muted rounded-full pl-0.5 pr-2 py-0.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                    style={{ background: avColor(c.participant_id) }}>
                    {initials(c.participant_name)}
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {c.participant_name}{c.quantity_claimed > 1 ? ` · ${c.quantity_claimed}×` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* My claim controls */}
          <div className="flex items-center gap-2">
            {myClaim ? (
              <>
                <Stepper
                  value={myClaim.quantity_claimed}
                  onMinus={() => handleClaimQty(-1)}
                  onPlus={() => handleClaimQty(+1)}
                />
                <span className="text-[11px] text-muted-foreground flex-1">meins</span>
                <button type="button" onClick={handleClaim}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 active:scale-95 transition-all">
                  ✓ {myGroupName ? `${myGroupName} dabei` : 'Dabei'}
                </button>
              </>
            ) : (
              <button type="button" onClick={handleClaim}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 active:scale-95 transition-all">
                {myGroupId ? `Wir bringen das (${myGroupName})` : '+ Ich bringe das mit'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Add item sheet ────────────────────────────────────────────────────────────
function AddItemSheet({
  defaultType, onClose, onAdd, myGroupName, isGroup,
}: {
  defaultType: TabKey; onClose: () => void; onAdd: (type: PacklistItemType, title: string) => Promise<void>
  myGroupName: string | null; isGroup: boolean
}) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onAdd(defaultType, title.trim())
    setSaving(false)
    onClose()
  }

  const labelMap: Record<TabKey, { icon: string; title: string; placeholder: string }> = {
    bringing: {
      icon: '🎒',
      title: isGroup ? `Was bringt ${myGroupName ?? 'ihr'} mit?` : 'Was bringst du mit?',
      placeholder: 'z.B. Sonnencreme, Erste-Hilfe-Kit…',
    },
    group_need: {
      icon: '🛍️',
      title: 'Was braucht die Gruppe?',
      placeholder: 'z.B. Volleyball, Grill, Schirm…',
    },
  }
  const meta = labelMap[defaultType]

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="px-5 pt-2 pb-28 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{meta.icon}</span>
            <h3 className="text-[15px] font-bold text-foreground">{meta.title}</h3>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={meta.placeholder}
            maxLength={100}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full px-3.5 py-3 rounded-[12px] bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-[15px] placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || saving}
            className={cn(
              'w-full py-3 rounded-[14px] font-bold text-[15px] transition-all active:scale-[0.98]',
              title.trim() && !saving ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            )}
          >
            {saving ? 'Wird gespeichert…' : 'Hinzufügen'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PacklistClient({
  tripId, items: initialItems, participants, myParticipantId, myGroupId, myGroupName, isActive,
}: PacklistClientProps) {
  const queryClient = useQueryClient()
  const { data: items = initialItems } = usePacklist(tripId, initialItems)

  const [tab, setTab] = useState<TabKey>('group_need')
  const [showSheet, setShowSheet] = useState(false)
  const [hideDone, setHideDone] = useState(true)

  const myParticipantName = participants.find(p => p.id === myParticipantId)?.name ?? ''

  const handleAdd = useCallback(async (item_type: PacklistItemType, title: string) => {
    const key = queryKeys.packlist.byTrip(tripId)
    const prev = queryClient.getQueryData<PacklistItem[]>(key)
    const tempId = `temp-${Date.now()}`
    queryClient.setQueryData<PacklistItem[]>(key, current => [
      ...(current ?? []),
      {
        id: tempId,
        trip_id: tripId,
        created_by_participant_id: myParticipantId,
        item_type,
        title,
        quantity_needed: 1,
        group_id: myGroupId,
        created_at: new Date().toISOString(),
        checked: false,
        claims: [],
        creator_name: myParticipantName,
      },
    ])
    try {
      const res = await fetch(`/api/trips/${tripId}/packlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, item_type }),
      })
      if (!res.ok) throw new Error()
    } catch {
      if (prev) queryClient.setQueryData(key, prev)
      toast.error('Fehler beim Speichern')
    } finally {
      queryClient.invalidateQueries({ queryKey: key })
    }
  }, [queryClient, tripId, myParticipantId, myGroupId, myParticipantName])

  const isGroup = !!myGroupId

  const bringItems = items.filter(i => i.item_type === 'bringing')
  const needItems  = items.filter(i => i.item_type === 'group_need')
  const myClaimedNeedItems = needItems.filter(i => i.claims.some(c => c.participant_id === myParticipantId))

  return (
    <div>
      <TripSubNav tripId={tripId} variant="listen" tabs={[
        { href: '/packlist', label: '🎒 Packliste' },
        { href: '/einkauf',  label: '🛒 Einkaufszettel' },
      ]} />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-muted rounded-[14px]">
        <button
          type="button"
          onClick={() => setTab('group_need')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[11px] text-[13px] font-bold transition-all',
            tab === 'group_need' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          )}
        >
          <Users className="w-3.5 h-3.5" />
          Gruppenbedarfe
          {needItems.length > 0 && (
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', tab === 'group_need' ? 'bg-amber-100 text-amber-700' : 'bg-muted-foreground/10 text-muted-foreground')}>
              {needItems.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('bringing')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[11px] text-[13px] font-bold transition-all',
            tab === 'bringing' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          )}
        >
          🎒 {isGroup ? 'Wir bringen mit' : 'Ich bringe mit'}
          {(bringItems.length + myClaimedNeedItems.length) > 0 && (
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', tab === 'bringing' ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground')}>
              {bringItems.length + myClaimedNeedItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab description */}
      {tab === 'bringing' && (
        <div className="mb-3 space-y-2">
          <p className="text-[11px] text-muted-foreground px-0.5">
            {isGroup
              ? `Was ${myGroupName ?? 'ihr'} mitbringt — hake ab, was bereits eingepackt ist.`
              : 'Was du mitbringst — hake ab, was bereits eingepackt ist.'}
          </p>
          {bringItems.length > 0 && (
            <>
              {/* Progress bar */}
              <div className="flex items-center gap-2.5 px-0.5">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${bringItems.length > 0 ? Math.round((bringItems.filter(i => i.checked).length / bringItems.length) * 100) : 0}%`,
                      background: bringItems.every(i => i.checked) ? '#2d7a4f' : '#1E6FD9',
                    }}
                  />
                </div>
                <span className="text-[11px] font-bold text-muted-foreground flex-shrink-0 tabular-nums">
                  {bringItems.filter(i => i.checked).length}/{bringItems.length}
                </span>
                <button
                  type="button"
                  onClick={() => setHideDone(h => !h)}
                  className="text-[11px] font-semibold text-primary flex-shrink-0"
                >
                  {hideDone ? 'Erledigte anzeigen' : 'Erledigte ausblenden'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {tab === 'group_need' && (
        <p className="text-[11px] text-muted-foreground mb-3 px-0.5">
          Dinge, die die Gruppe braucht — jeder kann sich bereit erklären sie mitzubringen.
        </p>
      )}

      {/* List */}
      <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden mb-4">
        {tab === 'bringing' && bringItems.length === 0 && myClaimedNeedItems.length === 0 ? (
          <div className="py-10 text-center">
            <span className="text-[40px] block mb-2">🎒</span>
            <p className="text-[13px] font-semibold text-foreground mb-1">Noch nichts auf der Liste</p>
            <p className="text-[12px] text-muted-foreground">Füge hinzu, was du mitbringst.</p>
          </div>
        ) : tab === 'bringing' && hideDone && bringItems.length > 0 && bringItems.every(i => i.checked) && myClaimedNeedItems.length === 0 ? (
          <div className="py-10 text-center">
            <span className="text-[40px] block mb-2">🎉</span>
            <p className="text-[13px] font-semibold text-foreground mb-1">Alles eingepackt!</p>
            <p className="text-[12px] text-muted-foreground">
              <button type="button" onClick={() => setHideDone(false)} className="underline">Alle anzeigen</button>
            </p>
          </div>
        ) : tab === 'group_need' && needItems.length === 0 ? (
          <div className="py-10 text-center">
            <span className="text-[40px] block mb-2">🛍️</span>
            <p className="text-[13px] font-semibold text-foreground mb-1">Noch keine Gruppenbedarfe</p>
            <p className="text-[12px] text-muted-foreground">Füge hinzu, was die Gruppe braucht.</p>
          </div>
        ) : tab === 'bringing' ? (
          <>
            {(hideDone ? bringItems.filter(i => !i.checked) : bringItems).map(item => (
              <BringingRow
                key={item.id}
                item={item}
                myParticipantId={myParticipantId}
                tripId={tripId}
                isActive={isActive}
              />
            ))}
            {/* Separator + claimed group_need items */}
            {myClaimedNeedItems.length > 0 && (
              <>
                {bringItems.length > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-muted/40">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Zugesagt aus Gruppenbedarfen
                    </span>
                  </div>
                )}
                {myClaimedNeedItems.map(item => {
                  const myClaim = item.claims.find(c => c.participant_id === myParticipantId)!
                  return (
                    <div key={item.id} className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border last:border-0">
                      <span className="text-[16px] flex-shrink-0">🛍️</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-semibold text-foreground">{item.title}</span>
                        <span className="text-[10px] text-muted-foreground/60 block leading-none mt-0.5">
                          {myClaim.quantity_claimed > 1 ? `${myClaim.quantity_claimed}× zugesagt` : 'Zugesagt'}
                          {myGroupName ? ` · ${myGroupName}` : ''}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-green-700 flex-shrink-0">✓</span>
                    </div>
                  )
                })}
              </>
            )}
          </>
        ) : (
          needItems.map(item => (
            <GroupNeedRow
              key={item.id}
              item={item}
              myParticipantId={myParticipantId}
              myParticipantName={myParticipantName}
              myGroupId={myGroupId}
              myGroupName={myGroupName}
              tripId={tripId}
              isActive={isActive}
            />
          ))
        )}
      </div>


      {/* FAB — nur bei Gruppenbedarfe-Tab */}
      {isActive && tab === 'group_need' && (
        <button
          type="button"
          onClick={() => setShowSheet(true)}
          className="fixed bottom-[84px] right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 bg-primary text-white pl-4 pr-5 py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all font-semibold text-[14px]"
          style={{ boxShadow: '0 4px 16px rgba(27,92,88,0.35)' }}
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Hinzufügen
        </button>
      )}

      {showSheet && (
        <AddItemSheet
          defaultType={tab}
          onClose={() => setShowSheet(false)}
          onAdd={handleAdd}
          myGroupName={myGroupName}
          isGroup={isGroup}
        />
      )}
    </div>
  )
}
