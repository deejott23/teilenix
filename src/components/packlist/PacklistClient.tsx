'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, ChevronRight, Lock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { PacklistItem, PacklistItemType, TripParticipant } from '@/types/app'

interface PacklistClientProps {
  tripId: string
  items: PacklistItem[]
  participants: TripParticipant[]
  myParticipantId: string
  myGroupId: string | null        // group_id of my participant (or null)
  myGroupName: string | null      // name of my group (or null)
  isActive: boolean
}

type FilterKey = 'all' | 'bringing' | 'group_need' | 'group_private'

// ── helpers ──────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
const AV_COLORS = ['#1b5c58', '#2d8a84', '#4ab5ae', '#c47a1e', '#6b4fa0', '#2d7a4f']
function avColor(participantId: string) {
  let h = 0; for (const c of participantId) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AV_COLORS[h % AV_COLORS.length]
}

// ── sub-components ────────────────────────────────────────────

function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onToggle() }}
      className={cn(
        'w-5 h-5 rounded-[6px] border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-100 active:scale-90',
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

function AvatarPill({ name, participantId, suffix }: { name: string; participantId: string; suffix?: string }) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-full pr-2 pl-0.5 py-0.5">
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
        style={{ background: avColor(participantId) }}
      >
        {initials(name)}
      </div>
      <span className="text-[10px] font-semibold text-muted-foreground">{name}{suffix ? ` · ${suffix}` : ''}</span>
    </div>
  )
}

// ── Section wrapper ──────────────────────────────────────────
function Section({
  icon, title, titleClass, badgeClass, count, accentColor, children, defaultOpen = true,
}: {
  icon: string; title: React.ReactNode; titleClass: string; badgeClass: string; count: number
  accentColor: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 -webkit-tap-highlight-color-transparent"
      >
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[15px] flex-shrink-0" style={{ background: accentColor + '22' }}>
          {icon}
        </div>
        <span className={cn('flex-1 text-left text-[11px] font-black uppercase tracking-[0.5px]', titleClass)}>
          {title}
        </span>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', badgeClass)}>{count}</span>
        <ChevronRight
          className={cn('w-4 h-4 text-muted-foreground/50 transition-transform duration-150 flex-shrink-0', open && 'rotate-90')}
          strokeWidth={2.5}
        />
      </button>
      {open && <div className="px-4 pb-3 flex flex-col gap-2">{children}</div>}
    </div>
  )
}

// ── Claim area (inside group_need items) ──────────────────────
function ClaimArea({
  item, myParticipantId, myGroupId, myGroupName, tripId, onRefresh,
}: {
  item: PacklistItem; myParticipantId: string; myGroupId: string | null; myGroupName: string | null
  tripId: string; onRefresh: () => void
}) {
  const totalClaimed = item.claims.reduce((s, c) => s + c.quantity_claimed, 0)
  const myClaim = item.claims.find(c => c.participant_id === myParticipantId)
  const remaining = Math.max(0, item.quantity_needed - totalClaimed)
  const pct = item.quantity_needed > 0 ? Math.min(100, (totalClaimed / item.quantity_needed) * 100) : 0
  const isCovered = remaining === 0
  const claimLabel = myGroupId ? 'Wir bringen das' : 'Ich bringe das'

  const handleClaim = async () => {
    const newQty = myClaim ? null : 1
    try {
      const res = await fetch(`/api/trips/${tripId}/packlist/${item.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_claimed: newQty }),
      })
      if (!res.ok) throw new Error()
      onRefresh()
    } catch {
      toast.error('Fehler beim Speichern')
    }
  }

  const handleQtyChange = async (delta: number) => {
    const current = myClaim?.quantity_claimed ?? 1
    const next = Math.max(1, Math.min(99, current + delta))
    if (next === current) return
    try {
      const res = await fetch(`/api/trips/${tripId}/packlist/${item.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_claimed: next }),
      })
      if (!res.ok) throw new Error()
      onRefresh()
    } catch {
      toast.error('Fehler beim Speichern')
    }
  }

  const handleNeedQtyChange = async (delta: number) => {
    const next = Math.max(1, Math.min(99, item.quantity_needed + delta))
    if (next === item.quantity_needed) return
    try {
      const res = await fetch(`/api/trips/${tripId}/packlist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_needed: next }),
      })
      if (!res.ok) throw new Error()
      onRefresh()
    } catch {
      toast.error('Fehler beim Speichern')
    }
  }

  return (
    <div className="mt-2.5 pt-2.5 border-t border-dashed border-border">
      {/* "Wir brauchen es X×" row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-muted-foreground">
          Wir brauchen es <span className={cn('font-black', isCovered ? 'text-green-700' : 'text-amber-600')}>{item.quantity_needed}×</span>
        </span>
        <div className="flex items-center bg-muted rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => handleNeedQtyChange(-1)}
            className="w-6 h-6 flex items-center justify-center text-primary font-bold text-sm active:bg-border transition-colors"
          >−</button>
          <span className="w-5 text-center text-xs font-bold text-foreground">{item.quantity_needed}</span>
          <button
            type="button"
            onClick={() => handleNeedQtyChange(+1)}
            className="w-6 h-6 flex items-center justify-center text-primary font-bold text-sm active:bg-border transition-colors"
          >+</button>
        </div>
      </div>

      {/* Progress bar */}
      {item.quantity_needed > 1 || totalClaimed > 0 ? (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: isCovered ? '#2d7a4f' : '#c47a1e' }}
            />
          </div>
          <span className={cn('text-[10px] font-bold', isCovered ? 'text-green-700' : 'text-amber-600')}>
            {isCovered ? '✓' : `${totalClaimed}/${item.quantity_needed}`}
          </span>
        </div>
      ) : null}

      {/* Claimers */}
      {item.claims.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {item.claims.map(c => (
            <AvatarPill key={c.participant_id} name={c.participant_name} participantId={c.participant_id} suffix={`${c.quantity_claimed}×`} />
          ))}
        </div>
      )}

      {/* My claim row */}
      <div className="flex items-center justify-between gap-2">
        {myClaim ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg overflow-hidden">
              <button type="button" onClick={() => handleQtyChange(-1)} className="w-6 h-6 flex items-center justify-center text-primary font-bold text-sm active:bg-border">−</button>
              <span className="w-5 text-center text-xs font-bold text-foreground">{myClaim.quantity_claimed}</span>
              <button type="button" onClick={() => handleQtyChange(+1)} className="w-6 h-6 flex items-center justify-center text-primary font-bold text-sm active:bg-border">+</button>
            </div>
            <span className="text-[11px] text-muted-foreground">meins</span>
          </div>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={handleClaim}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-100 active:scale-95',
            myClaim
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          )}
        >
          {myClaim ? (
            <>✓ {myGroupName ? `${myGroupName} dabei` : 'Zugesagt'}</>
          ) : (
            <>{claimLabel}{myGroupName ? ` (${myGroupName})` : ''}</>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Item card ─────────────────────────────────────────────────
function ItemCard({
  item, myParticipantId, myGroupId, myGroupName, tripId, onRefresh, isActive,
}: {
  item: PacklistItem; myParticipantId: string; myGroupId: string | null; myGroupName: string | null
  tripId: string; onRefresh: () => void; isActive: boolean
}) {
  const [deleting, setDeleting] = useState(false)
  const isMyItem = item.created_by_participant_id === myParticipantId

  const handleCheck = async () => {
    try {
      await fetch(`/api/trips/${tripId}/packlist/${item.id}/check`, { method: 'POST' })
      onRefresh()
    } catch {
      toast.error('Fehler')
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`"${item.title}" löschen?`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/packlist/${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Gelöscht')
      onRefresh()
    } catch {
      toast.error('Fehler beim Löschen')
      setDeleting(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(26,22,18,.04), 0 2px 8px rgba(26,22,18,.06)' }}
    >
      <div className="flex items-start gap-3 p-3.5">
        <Checkbox checked={item.checked} onToggle={handleCheck} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold text-foreground leading-snug', item.checked && 'line-through text-muted-foreground')}>
            {item.title}
          </p>
          {item.item_type === 'bringing' && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {item.creator_name} · für alle
            </p>
          )}
          {item.item_type === 'group_private' && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {item.creator_name}
            </p>
          )}
        </div>
        {isMyItem && isActive && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-muted-foreground/30 hover:text-destructive rounded-lg hover:bg-destructive/8 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
          </button>
        )}
      </div>
      {item.item_type === 'group_need' && (
        <div className="px-3.5 pb-3.5 -mt-1">
          <ClaimArea
            item={item} myParticipantId={myParticipantId} myGroupId={myGroupId}
            myGroupName={myGroupName} tripId={tripId} onRefresh={onRefresh}
          />
        </div>
      )}
    </div>
  )
}

// ── "Gruppe bringt mit" read-only row ─────────────────────────
function GroupBringsRow({
  name, participantId, title, subtitle,
}: { name: string; participantId: string; title: string; subtitle: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-3.5 flex items-center gap-3"
      style={{ boxShadow: '0 1px 3px rgba(26,22,18,.04), 0 2px 8px rgba(26,22,18,.06)' }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
        style={{ background: avColor(participantId) }}
      >
        {initials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug truncate">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <span className="text-[11px] font-bold text-green-700 flex-shrink-0">✓</span>
    </div>
  )
}

// ── Add Item Sheet ─────────────────────────────────────────────
function AddItemSheet({
  onClose, onAdd, myGroupName, isGroup,
}: {
  onClose: () => void; onAdd: (type: PacklistItemType, title: string) => Promise<void>; myGroupName: string | null; isGroup: boolean
}) {
  const [selected, setSelected] = useState<PacklistItemType | null>(null)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!selected || !title.trim()) return
    setSaving(true)
    await onAdd(selected, title.trim())
    setSaving(false)
    onClose()
  }

  const types: { type: PacklistItemType; icon: string; label: string; desc: string }[] = [
    {
      type: 'bringing',
      icon: '🎒',
      label: isGroup ? 'Wir bringen mit' : 'Ich bringe mit',
      desc: 'Alle Reiseteilnehmer sehen das',
    },
    {
      type: 'group_need',
      icon: '🛍️',
      label: 'Gruppe sucht jemanden',
      desc: 'Alle können Menge anpassen und claimen',
    },
    {
      type: 'group_private',
      icon: myGroupName ? '👨‍👩‍👧' : '🔒',
      label: myGroupName ? `Für ${myGroupName}` : 'Nur für mich',
      desc: myGroupName ? `Nur für ${myGroupName} sichtbar` : 'Komplett privat – nur du siehst das',
    },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-5 pb-10 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
        <div className="w-9 h-1 bg-muted rounded-full mx-auto mb-5" />
        <h3 className="text-[15px] font-bold text-foreground mb-4">Was hinzufügen?</h3>

        {/* Type selection */}
        <div className="flex flex-col gap-2 mb-5">
          {types.map(t => (
            <button
              key={t.type}
              type="button"
              onClick={() => setSelected(t.type)}
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-100 active:scale-[0.98] text-left',
                selected === t.type ? 'border-primary bg-primary/8' : 'border-border'
              )}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: selected === t.type ? 'rgba(27,92,88,0.12)' : 'var(--muted)' }}>
                {t.icon}
              </div>
              <div>
                <div className="text-[13px] font-bold text-foreground">{t.label}</div>
                <div className="text-[11px] text-muted-foreground">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Title input */}
        {selected && (
          <div className="mb-4">
            <Input
              autoFocus
              placeholder={selected === 'group_need' ? 'z.B. Erste-Hilfe-Set' : 'z.B. Sonnencreme SPF 50'}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="h-11 text-base"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        )}

        <Button
          className="w-full h-11 font-semibold"
          disabled={!selected || !title.trim() || saving}
          onClick={handleSubmit}
        >
          {saving ? 'Wird gespeichert…' : 'Hinzufügen'}
        </Button>
      </div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────
export default function PacklistClient({
  tripId, items: initialItems, participants, myParticipantId, myGroupId, myGroupName, isActive,
}: PacklistClientProps) {
  const router = useRouter()
  const [items, setItems] = useState<PacklistItem[]>(initialItems)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [showSheet, setShowSheet] = useState(false)

  const refresh = useCallback(() => router.refresh(), [router])

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

  // Categorise
  const bringItems    = items.filter(i => i.item_type === 'bringing')
  const needItems     = items.filter(i => i.item_type === 'group_need')
  const privateItems  = items.filter(i => i.item_type === 'group_private')

  // "Gruppe bringt mit" = all bringing items + fully-claimed group_need items (read-only overview)
  const groupBringsRows: { participantId: string; name: string; title: string; subtitle: string }[] = []
  bringItems.forEach(it => {
    groupBringsRows.push({
      participantId: it.created_by_participant_id,
      name: it.creator_name,
      title: it.title,
      subtitle: `${it.creator_name} bringt das mit`,
    })
  })
  needItems.forEach(it => {
    it.claims.forEach(c => {
      groupBringsRows.push({
        participantId: c.participant_id,
        name: c.participant_name,
        title: it.title,
        subtitle: `${c.participant_name} · ${c.quantity_claimed}× zugesagt`,
      })
    })
  })

  const isGroup = !!myGroupId

  // Filter visibility
  const showBring   = filter === 'all' || filter === 'bringing'
  const showNeed    = filter === 'all' || filter === 'group_need'
  const showGBring  = filter === 'all' || filter === 'bringing'
  const showPrivate = filter === 'all' || filter === 'group_private'

  const chipBase = 'flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-100 active:scale-95 border-[1.5px]'
  const chipActive = (key: FilterKey) => filter === key

  const totalAll = items.length

  return (
    <div>
      {/* ── Filter chips ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-4">
        {([
          { key: 'all' as FilterKey, label: `Alle (${totalAll})` },
          { key: 'bringing' as FilterKey, label: '🎒 Ich bringe' },
          { key: 'group_need' as FilterKey, label: '🛍️ Gruppe sucht' },
          { key: 'group_private' as FilterKey, label: myGroupName ? `🔒 ${myGroupName}` : '🔒 Nur ich' },
        ] as { key: FilterKey; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              chipBase,
              chipActive(key)
                ? 'bg-primary/10 text-primary border-primary/25'
                : 'bg-muted text-muted-foreground border-transparent'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Section 1: Ich bringe mit ── */}
      {showBring && (
        <div className="mb-1">
          <Section
            icon="🎒"
            title={isGroup ? 'Ich bringe mit' : 'Ich bringe mit'}
            titleClass="text-primary"
            badgeClass="bg-primary/10 text-primary"
            accentColor="#1b5c58"
            count={bringItems.length}
          >
            {bringItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Noch nichts hinzugefügt</p>
            ) : bringItems.map(item => (
              <ItemCard
                key={item.id} item={item} myParticipantId={myParticipantId}
                myGroupId={myGroupId} myGroupName={myGroupName}
                tripId={tripId} onRefresh={refresh} isActive={isActive}
              />
            ))}
          </Section>
        </div>
      )}

      {/* ── Section 2: Gruppe sucht ── */}
      {showNeed && (
        <div className="mb-1">
          <div className="h-px bg-border mx-4 my-0.5" />
          <Section
            icon="🛍️"
            title="Gruppe sucht"
            titleClass="text-amber-600"
            badgeClass="bg-amber-50 text-amber-600"
            accentColor="#c47a1e"
            count={needItems.length}
          >
            {needItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Noch keine Gruppenanfragen</p>
            ) : needItems.map(item => (
              <ItemCard
                key={item.id} item={item} myParticipantId={myParticipantId}
                myGroupId={myGroupId} myGroupName={myGroupName}
                tripId={tripId} onRefresh={refresh} isActive={isActive}
              />
            ))}
          </Section>
        </div>
      )}

      {/* ── Section 3: Gruppe bringt mit (read-only) ── */}
      {showGBring && (
        <div className="mb-1">
          <div className="h-px bg-border mx-4 my-0.5" />
          <Section
            icon="📦"
            title="Gruppe bringt mit"
            titleClass="text-green-700"
            badgeClass="bg-green-50 text-green-700"
            accentColor="#2d7a4f"
            count={groupBringsRows.length}
            defaultOpen={false}
          >
            {groupBringsRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Noch nichts zugesagt</p>
            ) : groupBringsRows.map((row, i) => (
              <GroupBringsRow
                key={i} name={row.name} participantId={row.participantId}
                title={row.title} subtitle={row.subtitle}
              />
            ))}
          </Section>
        </div>
      )}

      {/* ── Section 4: Gruppenname 🔒 / Nur ich ── */}
      {showPrivate && (
        <div className="mb-1">
          <div className="h-px bg-border mx-4 my-0.5" />
          <Section
            icon={myGroupName ? '👨‍👩‍👧' : '🔒'}
            title={
              <span className="flex items-center gap-1.5">
                {myGroupName ?? 'Nur ich'}
                <Lock className="w-3 h-3 opacity-50" strokeWidth={2.5} />
              </span>
            }
            titleClass="text-violet-700"
            badgeClass="bg-violet-50 text-violet-700"
            accentColor="#6b4fa0"
            count={privateItems.length}
          >
            {myGroupName && (
              <p className="text-[11px] text-muted-foreground bg-muted rounded-xl px-3 py-2 mb-1">
                🔒 Nur für Mitglieder von <strong>{myGroupName}</strong> sichtbar
              </p>
            )}
            {privateItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Keine privaten Items</p>
            ) : privateItems.map(item => (
              <ItemCard
                key={item.id} item={item} myParticipantId={myParticipantId}
                myGroupId={myGroupId} myGroupName={myGroupName}
                tripId={tripId} onRefresh={refresh} isActive={isActive}
              />
            ))}
          </Section>
        </div>
      )}

      {/* ── FAB ── */}
      {isActive && (
        <button
          type="button"
          onClick={() => setShowSheet(true)}
          className="fixed bottom-[84px] right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 bg-primary text-white pl-4 pr-5 py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all font-semibold text-[14px]"
          style={{ boxShadow: '0 4px 16px rgba(27,92,88,0.35)' }}
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          BringDings
        </button>
      )}

      {/* ── Add sheet ── */}
      {showSheet && (
        <AddItemSheet
          onClose={() => setShowSheet(false)}
          onAdd={handleAdd}
          myGroupName={myGroupName}
          isGroup={isGroup}
        />
      )}
    </div>
  )
}
