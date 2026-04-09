'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import NewThreadSheet from './NewThreadSheet'
import type { GroupThread, LinkedType, TripParticipant } from '@/types/app'
import { createClient } from '@/lib/supabase/client'

interface LinkedItem { id: string; title: string; subtitle: string; emoji: string }

interface Props {
  tripId: string
  initialThreads: GroupThread[]
  participants: TripParticipant[]
  myParticipantId: string
  activities: LinkedItem[]
  expenses: LinkedItem[]
  packlistItems: LinkedItem[]
  shoppingItems: LinkedItem[]
}

const TYPE_TAG: Record<LinkedType, { label: string; bg: string }> = {
  activity:      { label: 'Ausflug',       bg: 'bg-teal-100 text-teal-700' },
  expense:       { label: 'Ausgabe',        bg: 'bg-green-100 text-green-700' },
  packlist_item: { label: 'Packliste',      bg: 'bg-blue-100 text-blue-700' },
  shopping_item: { label: 'Einkaufszettel', bg: 'bg-amber-100 text-amber-700' },
}

const THREAD_ICONS: Record<LinkedType, string> = {
  activity: '✈️',
  expense: '💶',
  packlist_item: '🎒',
  shopping_item: '🛒',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Gestern'
  if (diffDays < 7) return d.toLocaleDateString('de', { weekday: 'short' })
  return d.toLocaleDateString('de', { day: 'numeric', month: 'short' })
}

export default function ThreadList({
  tripId, initialThreads, participants, myParticipantId,
  activities, expenses, packlistItems, shoppingItems,
}: Props) {
  const router = useRouter()
  const [threads, setThreads] = useState<GroupThread[]>(initialThreads)
  const [showNew, setShowNew] = useState(false)

  const participantMap = new Map(participants.map(p => [p.id, p]))

  const refresh = useCallback(() => router.refresh(), [router])

  useEffect(() => {
    setThreads(initialThreads)
  }, [initialThreads])

  // Realtime: listen for new threads + new messages (to update last_message)
  useEffect(() => {
    const supabase = createClient()
    const ch = supabase.channel(`threads-list-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_threads', filter: `trip_id=eq.${tripId}` }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `trip_id=eq.${tripId}` }, refresh)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [tripId, refresh])

  return (
    <div className="flex flex-col min-h-0">

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-bold text-foreground">
          {threads.length === 0 ? 'Noch keine Themen' : `${threads.length} Thema${threads.length !== 1 ? 'en' : ''}`}
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-primary text-primary-foreground text-[12px] font-bold active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          Neues Thema
        </button>
      </div>

      {/* Empty state */}
      {threads.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-2xl bg-muted mb-3">
            <MessageCircle className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-[14px] font-semibold text-foreground mb-1">Noch keine Themen</p>
          <p className="text-[12px] text-muted-foreground">Starte das erste Thema für die Gruppe</p>
        </div>
      )}

      {/* Thread list */}
      <div className="space-y-0 bg-card rounded-[18px] card-shadow border border-border overflow-hidden">
        {threads.map((thread, idx) => {
          const lastSender = thread.last_message?.participant_id
            ? participantMap.get(thread.last_message.participant_id)?.name
            : null
          const tag = thread.linked_type ? TYPE_TAG[thread.linked_type] : null
          const icon = thread.linked_type
            ? (thread.linked_emoji ?? THREAD_ICONS[thread.linked_type])
            : '💬'

          return (
            <Link
              key={thread.id}
              href={`/trips/${tripId}/gruppe/${thread.id}`}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 active:bg-muted transition-colors',
                idx < threads.length - 1 && 'border-b border-border'
              )}
            >
              {/* Icon */}
              <div className={cn(
                'w-11 h-11 rounded-[14px] flex items-center justify-center text-[22px] flex-shrink-0',
                thread.linked_type ? 'bg-muted' : 'bg-primary/10'
              )}>
                {icon}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-bold text-foreground truncate">{thread.title}</span>
                  {tag && (
                    <span className={cn('flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-[6px]', tag.bg)}>
                      {tag.label}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {thread.last_message
                    ? `${lastSender ? lastSender + ': ' : ''}${thread.last_message.content}`
                    : 'Noch keine Nachrichten'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground/60">
                    {thread.message_count} {thread.message_count === 1 ? 'Nachricht' : 'Nachrichten'}
                  </span>
                </div>
              </div>

              {/* Time + chevron */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {thread.last_message && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(thread.last_message.created_at)}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* New Thread Sheet */}
      {showNew && (
        <NewThreadSheet
          tripId={tripId}
          onClose={() => setShowNew(false)}
          activities={activities}
          expenses={expenses}
          packlistItems={packlistItems}
          shoppingItems={shoppingItems}
        />
      )}
    </div>
  )
}
