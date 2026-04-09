'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Send, SmilePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { GroupMessage, GroupThread, TripParticipant, LinkedType } from '@/types/app'

interface Props {
  tripId: string
  thread: GroupThread
  initialMessages: GroupMessage[]
  participants: TripParticipant[]
  myParticipantId: string
}

const LINKED_HREF: Record<LinkedType, (tripId: string, id: string) => string> = {
  activity:      (t, id) => `/trips/${t}/planen/${id}`,
  expense:       (t, _)  => `/trips/${t}/expenses`,
  packlist_item: (t, _)  => `/trips/${t}/packlist`,
  shopping_item: (t, _)  => `/trips/${t}/einkauf`,
}

const LINKED_BG: Record<LinkedType, string> = {
  activity:      'bg-teal-50 border-teal-200/80',
  expense:       'bg-green-50 border-green-200/80',
  packlist_item: 'bg-blue-50 border-blue-200/80',
  shopping_item: 'bg-amber-50 border-amber-200/80',
}

const LINKED_ICON_BG: Record<LinkedType, string> = {
  activity:      'bg-teal-100',
  expense:       'bg-green-100',
  packlist_item: 'bg-blue-100',
  shopping_item: 'bg-amber-100',
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '😮', '😢']

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Heute'
  if (d.toDateString() === yesterday.toDateString()) return 'Gestern'
  return d.toLocaleDateString('de', { weekday: 'long', day: 'numeric', month: 'long' })
}

function groupByDay(messages: GroupMessage[]) {
  const groups: { date: string; messages: GroupMessage[] }[] = []
  let currentDate = ''
  for (const msg of messages) {
    const date = new Date(msg.created_at).toDateString()
    if (date !== currentDate) {
      currentDate = date
      groups.push({ date, messages: [] })
    }
    groups[groups.length - 1].messages.push(msg)
  }
  return groups
}

// Aggregate reactions: { emoji → count, myReaction }
function aggregateReactions(
  reactions: { emoji: string; participant_id: string }[],
  myParticipantId: string
) {
  const map = new Map<string, { count: number; mine: boolean }>()
  for (const r of reactions) {
    const cur = map.get(r.emoji) ?? { count: 0, mine: false }
    map.set(r.emoji, { count: cur.count + 1, mine: cur.mine || r.participant_id === myParticipantId })
  }
  return [...map.entries()].map(([emoji, { count, mine }]) => ({ emoji, count, mine }))
}

// AVATAR COLORS
const COLORS = ['#7c3aed','#db2777','#0891b2','#d97706','#16a34a','#9333ea','#dc2626','#0284c7']
function avatarColor(id: string) { return COLORS[id.charCodeAt(0) % COLORS.length] }

export default function ThreadDetail({
  tripId, thread, initialMessages, participants, myParticipantId,
}: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<GroupMessage[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [reactionTarget, setReactionTarget] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const participantMap = new Map(participants.map(p => [p.id, p]))

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => { scrollToBottom() }, [scrollToBottom])

  // Realtime
  useEffect(() => {
    const supabase = createClient()
    const ch = supabase.channel(`thread-${thread.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `thread_id=eq.${thread.id}` },
        (payload) => {
          const newMsg = { ...(payload.new as GroupMessage), reactions: [] }
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          setTimeout(() => scrollToBottom(true), 50)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        () => { router.refresh() }
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [thread.id, router, scrollToBottom])

  // Sync messages from server refresh
  useEffect(() => {
    setMessages(initialMessages)
    setTimeout(() => scrollToBottom(), 50)
  }, [initialMessages, scrollToBottom])

  async function send() {
    if (!text.trim() || sending) return
    const optimistic: GroupMessage = {
      id: `opt-${Date.now()}`,
      thread_id: thread.id,
      trip_id: tripId,
      participant_id: myParticipantId,
      content: text.trim(),
      created_at: new Date().toISOString(),
      reactions: [],
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    setSending(true)
    setTimeout(() => scrollToBottom(true), 50)

    try {
      const res = await fetch(`/api/trips/${tripId}/threads/${thread.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: optimistic.content }),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m))
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setText(optimistic.content)
    } finally {
      setSending(false)
    }
  }

  async function react(messageId: string, emoji: string) {
    setReactionTarget(null)
    // Optimistic
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m
      const alreadyMine = m.reactions.find(r => r.participant_id === myParticipantId && r.emoji === emoji)
      const reactions = alreadyMine
        ? m.reactions.filter(r => !(r.participant_id === myParticipantId && r.emoji === emoji))
        : [...m.reactions, { emoji, participant_id: myParticipantId }]
      return { ...m, reactions }
    }))
    await fetch(`/api/trips/${tripId}/threads/${thread.id}/messages/${messageId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
  }

  const groups = groupByDay(messages)
  const linkedHref = thread.linked_type && thread.linked_id
    ? LINKED_HREF[thread.linked_type](tripId, thread.linked_id)
    : null

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100dvh - 180px)' }}>

      {/* ── Linked element banner ── */}
      {thread.linked_type && thread.linked_title && linkedHref && (
        <Link
          href={linkedHref}
          className={cn(
            'flex items-center gap-3 rounded-[16px] border px-3.5 py-2.5 mb-3 active:opacity-80 transition-opacity',
            LINKED_BG[thread.linked_type]
          )}
        >
          <div className={cn('w-9 h-9 rounded-[11px] flex items-center justify-center text-[19px] flex-shrink-0', LINKED_ICON_BG[thread.linked_type])}>
            {thread.linked_emoji ?? '🔗'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Verknüpft</div>
            <div className="text-[13px] font-bold text-foreground truncate">{thread.linked_title}</div>
            {thread.linked_subtitle && (
              <div className="text-[11px] text-muted-foreground truncate">{thread.linked_subtitle}</div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </Link>
      )}

      {/* ── Message list ── */}
      <div
        className="flex-1 overflow-y-auto -mx-4 px-4 pb-2"
        style={{ background: 'linear-gradient(180deg, var(--background) 0%, var(--background) 100%)' }}
        onClick={() => setReactionTarget(null)}
      >
        {messages.length === 0 && (
          <div className="text-center py-12 text-[13px] text-muted-foreground">
            Noch keine Nachrichten — schreib als Erster!
          </div>
        )}

        {groups.map(group => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-bold text-muted-foreground/60 px-2">
                {formatDateSeparator(group.messages[0].created_at)}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {group.messages.map((msg, idx) => {
              const isMe = msg.participant_id === myParticipantId
              const sender = msg.participant_id ? participantMap.get(msg.participant_id) : null
              const prevMsg = idx > 0 ? group.messages[idx - 1] : null
              const showAvatar = !isMe && msg.participant_id !== prevMsg?.participant_id
              const aggregated = aggregateReactions(msg.reactions, myParticipantId)

              return (
                <div key={msg.id} className={cn('flex gap-2 mb-1', isMe && 'flex-row-reverse')}>
                  {/* Avatar */}
                  <div className="w-7 flex-shrink-0 flex items-end pb-5">
                    {showAvatar && !isMe && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: avatarColor(msg.participant_id ?? '0') }}
                      >
                        {sender?.name?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>

                  {/* Bubble + reactions */}
                  <div className={cn('max-w-[72%] flex flex-col', isMe && 'items-end')}>
                    {showAvatar && !isMe && (
                      <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-1">
                        {sender?.name ?? 'Unbekannt'}
                      </span>
                    )}

                    <button
                      onClick={() => {
                        if (reactionTarget === msg.id) setReactionTarget(null)
                      }}
                      onContextMenu={e => { e.preventDefault(); setReactionTarget(msg.id) }}
                      className={cn(
                        'text-left px-3.5 py-2.5 rounded-[18px] text-[13px] leading-[1.45] break-words',
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-[4px]'
                          : 'bg-card text-foreground rounded-bl-[4px] shadow-sm border border-border'
                      )}
                    >
                      {msg.content}
                    </button>

                    <span className={cn(
                      'text-[9px] text-muted-foreground/60 mt-0.5 mx-1',
                      isMe && 'text-right'
                    )}>
                      {formatTime(msg.created_at)}
                    </span>

                    {/* Reaction picker */}
                    {reactionTarget === msg.id && (
                      <div className={cn(
                        'flex gap-1 bg-card rounded-full border border-border shadow-lg px-2 py-1.5 mb-1',
                        isMe ? 'self-end' : 'self-start'
                      )}>
                        {QUICK_REACTIONS.map(e => (
                          <button
                            key={e}
                            onClick={() => react(msg.id, e)}
                            className="text-[18px] hover:scale-125 transition-transform active:scale-90"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Aggregated reactions */}
                    {aggregated.length > 0 && (
                      <div className={cn('flex gap-1 flex-wrap mt-1', isMe && 'justify-end')}>
                        {aggregated.map(({ emoji, count, mine }) => (
                          <button
                            key={emoji}
                            onClick={() => react(msg.id, emoji)}
                            className={cn(
                              'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                              mine
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : 'bg-card border-border text-foreground'
                            )}
                          >
                            {emoji} <span className="font-semibold">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="flex items-end gap-2.5 pt-2 border-t border-border -mx-4 px-4 pb-1 bg-background">
        <button
          onClick={() => setReactionTarget(null)}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mb-0.5"
        >
          <SmilePlus className="w-4 h-4 text-muted-foreground" />
        </button>
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Nachricht schreiben…"
          rows={1}
          className="flex-1 bg-muted rounded-[18px] px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 resize-none outline-none border border-transparent focus:border-primary/30 leading-[1.4] max-h-28 overflow-y-auto"
          style={{ minHeight: 36 }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mb-0.5 disabled:opacity-40 active:scale-90 transition-transform"
        >
          <Send className="w-4 h-4 text-primary-foreground" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
