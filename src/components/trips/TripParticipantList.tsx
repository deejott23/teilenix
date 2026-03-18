'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, UserPlus, Users, Plus, Minus, Pencil, Check, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { TripParticipant } from '@/types/app'
import { cn } from '@/lib/utils'

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-600',
  'bg-sky-100 text-sky-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-rose-100 text-rose-600',
  'bg-primary/10 text-primary',
]
function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

interface TripParticipantListProps {
  tripId: string
  participants: TripParticipant[]
  inviteCode: string
  isCreator: boolean
  isActive: boolean
  currentUserId: string
}

type EditState = { name: string; shares: number }

export default function TripParticipantList({
  tripId,
  participants,
  inviteCode,
  isActive,
  currentUserId,
}: TripParticipantListProps) {
  const router = useRouter()

  const [showGuestForm, setShowGuestForm] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [addingGuest, setAddingGuest] = useState(false)

  const [showGroupForm, setShowGroupForm] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupShares, setGroupShares] = useState(2)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [addingGroup, setAddingGroup] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', shares: 1 })
  const [saving, setSaving] = useState(false)

  // Which group is expanded to show member assignment
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${inviteCode}`
    : `/join/${inviteCode}`

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success('Einladungslink kopiert!')
    } catch {
      toast.error('Konnte nicht kopieren')
    }
  }

  const handleAddGuest = async () => {
    if (!guestName.trim()) return
    setAddingGuest(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName.trim(), shares: 1 }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      toast.success(`${guestName.trim()} hinzugefügt`)
      setGuestName('')
      setShowGuestForm(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setAddingGuest(false)
    }
  }

  const handleAddGroup = async () => {
    if (!groupName.trim()) return
    setAddingGroup(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim(), shares: groupShares, is_group: true }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const { participant: newGroup } = await res.json()

      // Assign selected members to the new group in parallel
      if (selectedMemberIds.length > 0) {
        const results = await Promise.allSettled(selectedMemberIds.map(id =>
          fetch(`/api/trips/${tripId}/participants/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_id: newGroup.id }),
          })
        ))
        const failed = results.filter(r => r.status === 'rejected').length
        if (failed > 0) {
          toast.error(`${failed} Teilnehmer konnten nicht zugeordnet werden`)
        }
      }

      toast.success(`Gruppe "${groupName.trim()}" erstellt`)
      setGroupName('')
      setGroupShares(2)
      setSelectedMemberIds([])
      setShowGroupForm(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setAddingGroup(false)
    }
  }

  const toggleMember = (id: string) =>
    setSelectedMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const startEdit = (p: TripParticipant) => {
    setEditingId(p.id)
    setEditState({ name: p.name, shares: p.shares })
  }

  const handleSaveEdit = async (participantId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editState.name.trim(), shares: editState.shares }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      toast.success('Gespeichert')
      setEditingId(null)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: TripParticipant) => {
    if (!confirm(`"${p.name}" wirklich entfernen?`)) return
    try {
      const res = await fetch(`/api/trips/${tripId}/participants/${p.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      toast.success(`${p.name} entfernt`)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    }
  }

  const handleAssignToGroup = async (participantId: string, groupId: string | null) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    }
  }

  // Separate groups from individual participants
  const groups = participants.filter(p => p.is_group)
  const individuals = participants.filter(p => !p.is_group)
  // Participants not yet in any group (can be assigned)
  const ungrouped = individuals.filter(p => !p.group_id)

  return (
    <div className="space-y-5">

      {/* Invite section */}
      {isActive && (
        <div className="bg-card card-shadow rounded-2xl p-5 space-y-3">
          <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Einladen</h2>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-xl px-3 py-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Code</p>
              <p className="font-bold text-foreground tracking-widest">{inviteCode}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={copyInviteLink}>
              <Copy className="w-4 h-4" />
              Kopieren
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Teile diesen Code oder Link, damit andere der Reise beitreten können.
          </p>
        </div>
      )}

      {/* Groups */}
      {(groups.length > 0 || isActive) && (
        <div className="bg-card card-shadow rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
              <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Gruppen</h2>
            </div>
            {isActive && (
              <Button variant="ghost" size="sm" className="gap-1 text-xs rounded-lg h-8"
                onClick={() => { setShowGroupForm(v => !v) }}>
                <Plus className="w-3.5 h-3.5" />
                Gruppe
              </Button>
            )}
          </div>

          {/* Group form */}
          {showGroupForm && (
            <div className="px-4 py-4 bg-primary/5 border-b border-border space-y-3">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">Neue Gruppe</p>
              <p className="text-xs text-muted-foreground">
                Fasse mehrere Personen zusammen, die Kosten gemeinsam tragen (z.B. eine Familie).
              </p>
              <Input placeholder="Gruppenname, z.B. Familie Müller" value={groupName}
                onChange={e => setGroupName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                className="h-9 rounded-xl" autoFocus />
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground flex-1">Personen in der Gruppe:</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGroupShares(s => Math.max(2, s - 1))}
                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold text-foreground">{groupShares}</span>
                  <button onClick={() => setGroupShares(s => Math.min(20, s + 1))}
                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Assign existing ungrouped participants */}
              {ungrouped.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Teilnehmer direkt zuordnen (optional):</p>
                  {ungrouped.map(p => {
                    const checked = selectedMemberIds.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleMember(p.id)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-colors',
                          checked
                            ? 'bg-primary/10 border-primary/30 text-foreground'
                            : 'bg-background border-border text-muted-foreground hover:border-primary/20'
                        )}
                      >
                        <div className={cn('w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors',
                          checked ? 'bg-primary border-primary' : 'border-border'
                        )}>
                          {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </div>
                        <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0', getAvatarColor(p.name))}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium flex-1">{p.name}</span>
                        {!p.user_id && (
                          <span className="text-[9px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Gast</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" disabled={addingGroup || !groupName.trim()} onClick={handleAddGroup} className="rounded-xl h-9 flex-1">
                  {addingGroup ? '…' : selectedMemberIds.length > 0 ? `Gruppe erstellen & ${selectedMemberIds.length} zuordnen` : 'Gruppe erstellen'}
                </Button>
                <button onClick={() => { setShowGroupForm(false); setSelectedMemberIds([]) }} className="text-muted-foreground hover:text-foreground px-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {groups.length === 0 && !showGroupForm && (
            <p className="px-4 py-4 text-sm text-muted-foreground">Noch keine Gruppen angelegt.</p>
          )}

          <div className="divide-y divide-border/50">
            {groups.map(group => {
              const members = individuals.filter(p => p.group_id === group.id)
              const isExpanded = expandedGroupId === group.id
              const isEditing = editingId === group.id

              return (
                <div key={group.id}>
                  {isEditing ? (
                    <div className="px-4 py-3 bg-muted/30 space-y-2">
                      <Input
                        value={editState.name}
                        onChange={e => setEditState(s => ({ ...s, name: e.target.value }))}
                        className="h-9 rounded-xl"
                        autoFocus
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground flex-1">Personen in der Gruppe:</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditState(s => ({ ...s, shares: Math.max(1, s.shares - 1) }))}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-bold">{editState.shares}</span>
                          <button onClick={() => setEditState(s => ({ ...s, shares: Math.min(20, s.shares + 1) }))}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 ml-1">
                          <button onClick={() => handleSaveEdit(group.id)} disabled={saving}
                            className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0', getAvatarColor(group.name))}>
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm text-foreground truncate">{group.name}</p>
                          <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wide flex-shrink-0">Gruppe</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {group.shares} Anteile · {members.length} Teilnehmer zugeordnet
                        </p>
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Teilnehmer zuordnen"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => startEdit(group)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(group)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Member assignment panel */}
                  {isExpanded && !isEditing && (
                    <div className="px-4 pb-3 pt-1 bg-primary/5 border-t border-border/60 space-y-1.5">
                      <p className="text-[11px] font-bold text-primary uppercase tracking-wide mb-2">Teilnehmer zuordnen</p>

                      {/* Current members */}
                      {members.map(m => (
                        <div key={m.id} className="flex items-center gap-2 py-1">
                          <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0', getAvatarColor(m.name))}>
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-foreground flex-1">{m.name}</span>
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">zugeordnet</span>
                          <button
                            onClick={() => handleAssignToGroup(m.id, null)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Entfernen"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* Ungrouped participants that can be added */}
                      {ungrouped.filter(p => p.group_id !== group.id).map(p => (
                        <div key={p.id} className="flex items-center gap-2 py-1">
                          <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0', getAvatarColor(p.name))}>
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-muted-foreground flex-1">{p.name}</span>
                          <button
                            onClick={() => handleAssignToGroup(p.id, group.id)}
                            className="text-[11px] font-semibold text-primary border border-primary/30 px-2 py-0.5 rounded-full hover:bg-primary/10 transition-colors"
                          >
                            + zuordnen
                          </button>
                        </div>
                      ))}

                      {members.length === 0 && ungrouped.length === 0 && (
                        <p className="text-xs text-muted-foreground py-1">Keine weiteren Teilnehmer verfügbar.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Individual participants */}
      <div className="bg-card card-shadow rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
            <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
              Teilnehmer ({individuals.length})
            </h2>
          </div>
          {isActive && (
            <Button variant="ghost" size="sm" className="gap-1 text-xs rounded-lg h-8"
              onClick={() => setShowGuestForm(v => !v)}>
              <UserPlus className="w-3.5 h-3.5" />
              + Gast
            </Button>
          )}
        </div>

        {/* Guest form */}
        {showGuestForm && (
          <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
            <Input placeholder="Name des Gastes" value={guestName}
              onChange={e => setGuestName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddGuest()}
              className="h-9 rounded-xl flex-1" autoFocus />
            <Button size="sm" disabled={addingGuest} onClick={handleAddGuest} className="rounded-xl h-9">
              {addingGuest ? '…' : 'Hinzufügen'}
            </Button>
            <button onClick={() => setShowGuestForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="divide-y divide-border/50">
          {individuals.map(p => {
            const isYou = p.user_id === currentUserId
            const isEditing = editingId === p.id
            const myGroup = p.group_id ? groups.find(g => g.id === p.group_id) : null

            if (isEditing) {
              return (
                <div key={p.id} className="px-4 py-3 bg-muted/30 space-y-2">
                  <Input value={editState.name} onChange={e => setEditState(s => ({ ...s, name: e.target.value }))}
                    className="h-9 rounded-xl" autoFocus />
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground flex-1">Anteile an Kosten:</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditState(s => ({ ...s, shares: Math.max(1, s.shares - 1) }))}
                        className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold">{editState.shares}</span>
                      <button onClick={() => setEditState(s => ({ ...s, shares: Math.min(20, s.shares + 1) }))}
                        className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 ml-1">
                      <button onClick={() => handleSaveEdit(p.id)} disabled={saving}
                        className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={p.id} className={cn('flex items-center gap-3 px-4 py-3.5', myGroup && 'opacity-60')}>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0', getAvatarColor(p.name))}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                    {isYou && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wide flex-shrink-0">du</span>
                    )}
                    {!p.user_id && (
                      <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[9px] font-semibold flex-shrink-0">Gast</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {myGroup
                      ? `→ ${myGroup.name}`
                      : p.shares > 1 ? `${p.shares} Anteile` : '1 Anteil'}
                  </p>
                </div>
                {isActive && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => startEdit(p)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {!p.user_id && (
                      <button onClick={() => handleDelete(p)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
