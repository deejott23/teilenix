'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { usePacklist, usePacklistInvalidate } from '@/hooks/usePacklist'
import TripSubNav from '@/components/layout/TripSubNav'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Check, X, ChevronDown, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PacklistItem, PacklistItemType, TripParticipant } from '@/types/app'

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

const AV_COLORS = ['#1b5c58', '#2d8a84', '#4ab5ae', '#c47a1e', '#6b4fa0', '#2d7a4f']
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

// ── Quantity stepper ──────────────────────────────────────────────────────────
function Stepper({ value, onMinus, onPlus, min = 1 }: { value: number; onMinus: () => void; onPlus: () => void; min?: number }) {
  return (
    <div className="flex items-center gap-0 bg-muted rounded-lg overflow-hidden flex-shrink-0">
      <button type="button" onClick={onMinus} disabled={value <= min}
        className="w-7 h-7 flex items-center justify-center text-primary font-bold text-[15px] disabled:opacity-30 active:bg-border/60 transition-colors">
        −
      </button>
      <span className="w-6 text-center text-[12px] font-bold text-foreground tabular-nums">{value}</span>
      <button type="button" onClick={onPlus}
        className="w-7 h-7 flex items-center justify-center text-primary font-bold text-[15px] active:bg-border/60 transition-colors">
        +
      </button>
    </div>
  )
}

// ── Bringing item row ─────────────────────────────────────────────────────────
function BringingRow({
  item, myParticipantId, tripId, onRefresh, isActive,
}: {
  item: PacklistItem; myParticipantId: string; tripId: string; onRefresh: () => void; isActive: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMyItem = item.created_by_participant_id === myParticipantId

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const handleCheck = async () => {
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}/check`, { method: 'POST' })
      onRefresh()
    } catch { toast.error('Fehler') }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`"${item.title}" löschen?`)) return
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}`, { method: 'DELETE' })
      toast.success('Gelöscht')
      onRefresh()
    } catch { toast.error('Fehler beim Löschen') }
  }

  const handleEditSave = async () => {
    const trimmed = editTitle.trim()
    if (!trimmed || trimmed === item.title) { setEditing(false); setEditTitle(item.title); return }
    setSaving(true)
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      setEditing(false)
      onRefresh()
    } catch { toast.error('Fehler') } finally { setSaving(false) }
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
        {!editing && (
          <span className="text-[10px] text-muted-foreground/60 ml-0 block leading-none mt-0.5">
            {item.creator_name}
          </span>
        )}
      </div>

      {isMyItem && isActive && !editing && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button type="button" onClick={() => setEditing(true)}
            className="p-1.5 text-muted-foreground/40 hover:text-primary rounded-lg transition-colors">
            <Pencil className="w-3 h-3" strokeWidth={2} />
          </button>
          <button type="button" onClick={handleDelete}
            className="p-1.5 text-muted-foreground/40 hover:text-destructive rounded-lg transition-colors">
            <Trash2 className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Group need item row ───────────────────────────────────────────────────────
function GroupNeedRow({
  item, myParticipantId, myGroupId, myGroupName, tripId, onRefresh, isActive,
}: {
  item: PacklistItem; myParticipantId: string; myGroupId: string | null; myGroupName: string | null
  tripId: string; onRefresh: () => void; isActive: boolean
}) {
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
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_claimed: myClaim ? null : 1 }),
      })
      onRefresh()
    } catch { toast.error('Fehler') }
  }

  const handleClaimQty = async (delta: number) => {
    const next = Math.max(1, Math.min(99, (myClaim?.quantity_claimed ?? 1) + delta))
    if (next === myClaim?.quantity_claimed) return
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_claimed: next }),
      })
      onRefresh()
    } catch { toast.error('Fehler') }
  }

  const handleNeedQty = async (delta: number) => {
    const next = Math.max(1, Math.min(99, item.quantity_needed + delta))
    if (next === item.quantity_needed) return
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_needed: next }),
      })
      onRefresh()
    } catch { toast.error('Fehler') }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`"${item.title}" löschen?`)) return
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}`, { method: 'DELETE' })
      toast.success('Gelöscht')
      onRefresh()
    } catch { toast.error('Fehler') }
  }

  const handleEditSave = async () => {
    const trimmed = editTitle.trim()
    if (!trimmed || trimmed === item.title) { setEditing(false); setEditTitle(item.title); return }
    setSaving(true)
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      setEditing(false)
      onRefresh()
    } catch { toast.error('Fehler') } finally { setSaving(false) }
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
          <span className="text-[10px] text-muted-foreground/60 block leading-none mt-0.5">
            {item.creator_name}
          </span>
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
                    <Pencil className="w-3 h-3" strokeWidth={2} />
                    Titel bearbeiten
                  </button>
                  <button type="button" onClick={handleDelete}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors ml-3">
                    <Trash2 className="w-3 h-3" strokeWidth={2} />
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
  const invalidate = usePacklistInvalidate(tripId)
  const { data: items = initialItems } = usePacklist(tripId, initialItems)

  const [tab, setTab] = useState<TabKey>('bringing')
  const [showSheet, setShowSheet] = useState(false)

  const refresh = useCallback(() => invalidate(), [invalidate])

  const handleAdd = async (item_type: PacklistItemType, title: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/packlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, item_type }),
      })
      if (!res.ok) throw new Error()
      toast.success('Hinzugefügt!')
      refresh()
    } catch {
      toast.error('Fehler beim Speichern')
    }
  }

  const isGroup = !!myGroupId

  const bringItems = items.filter(i => i.item_type === 'bringing')
  const needItems  = items.filter(i => i.item_type === 'group_need')
  const currentItems = tab === 'bringing' ? bringItems : needItems

  return (
    <div>
      <TripSubNav tripId={tripId} tabs={[
        { href: '/packlist', label: '🎒 Packliste' },
        { href: '/einkauf',  label: '🛒 Einkaufszettel' },
      ]} />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-muted rounded-[14px]">
        <button
          type="button"
          onClick={() => setTab('bringing')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[11px] text-[13px] font-bold transition-all',
            tab === 'bringing' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          )}
        >
          🎒 {isGroup ? 'Wir bringen mit' : 'Ich bringe mit'}
          {bringItems.length > 0 && (
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', tab === 'bringing' ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground')}>
              {bringItems.length}
            </span>
          )}
        </button>
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
      </div>

      {/* Tab description */}
      {tab === 'bringing' && (
        <p className="text-[11px] text-muted-foreground mb-3 px-0.5">
          {isGroup
            ? `Was ${myGroupName ?? 'ihr'} mitbringt — hake ab, was bereits eingepackt ist.`
            : 'Was du mitbringst — hake ab, was bereits eingepackt ist.'}
        </p>
      )}
      {tab === 'group_need' && (
        <p className="text-[11px] text-muted-foreground mb-3 px-0.5">
          Dinge, die die Gruppe braucht — jeder kann sich bereit erklären sie mitzubringen.
        </p>
      )}

      {/* List */}
      <div className="bg-card rounded-[18px] card-shadow border border-border overflow-hidden mb-4">
        {currentItems.length === 0 ? (
          <div className="py-10 text-center">
            <span className="text-[40px] block mb-2">{tab === 'bringing' ? '🎒' : '🛍️'}</span>
            <p className="text-[13px] font-semibold text-foreground mb-1">
              {tab === 'bringing' ? 'Noch nichts auf der Liste' : 'Noch keine Gruppenbedarfe'}
            </p>
            <p className="text-[12px] text-muted-foreground">
              {tab === 'bringing'
                ? 'Füge hinzu, was du mitbringst.'
                : 'Füge hinzu, was die Gruppe braucht.'}
            </p>
          </div>
        ) : tab === 'bringing' ? (
          bringItems.map(item => (
            <BringingRow
              key={item.id}
              item={item}
              myParticipantId={myParticipantId}
              tripId={tripId}
              onRefresh={refresh}
              isActive={isActive}
            />
          ))
        ) : (
          needItems.map(item => (
            <GroupNeedRow
              key={item.id}
              item={item}
              myParticipantId={myParticipantId}
              myGroupId={myGroupId}
              myGroupName={myGroupName}
              tripId={tripId}
              onRefresh={refresh}
              isActive={isActive}
            />
          ))
        )}
      </div>

      {/* Done summary for bringing tab */}
      {tab === 'bringing' && bringItems.length > 0 && (
        <p className="text-[11px] text-muted-foreground text-center">
          {bringItems.filter(i => i.checked).length} von {bringItems.length} eingepackt
        </p>
      )}

      {/* FAB */}
      {isActive && (
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
