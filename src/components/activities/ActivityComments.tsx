'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ActivityComment } from '@/types/app'

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function formatDateHeader(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Heute'
  if (d.toDateString() === yesterday.toDateString()) return 'Gestern'
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })
}

interface ActivityCommentsProps {
  activityId: string
  tripId: string
  myParticipantId: string
  initialComments: ActivityComment[]
}

export default function ActivityComments({
  activityId,
  tripId,
  myParticipantId,
  initialComments,
}: ActivityCommentsProps) {
  const [comments, setComments] = useState<ActivityComment[]>(initialComments)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const handleSend = async () => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    try {
      const res = await fetch(`/api/trips/${tripId}/activities/${activityId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, participantId: myParticipantId }),
      })
      if (!res.ok) throw new Error()
      const newComment: ActivityComment = await res.json()
      setComments(prev => [...prev, newComment])
    } catch {
      toast.error('Kommentar konnte nicht gesendet werden')
      setText(content) // restore
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleDelete = async (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId))
    try {
      await fetch(`/api/trips/${tripId}/activities/${activityId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      })
    } catch {
      toast.error('Fehler beim Löschen')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group comments by date
  const grouped: { dateLabel: string; items: ActivityComment[] }[] = []
  for (const c of comments) {
    const label = formatDateHeader(c.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.dateLabel === label) {
      last.items.push(c)
    } else {
      grouped.push({ dateLabel: label, items: [c] })
    }
  }

  return (
    <div className="bg-card rounded-[18px] card-shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[13px] font-bold text-foreground">Kommentare</h2>
      </div>

      {/* Chat area */}
      <div className="px-3 py-3 space-y-3 max-h-[360px] overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-center text-[12px] text-muted-foreground py-4">
            Noch keine Kommentare. Sei der Erste! 💬
          </p>
        )}

        {grouped.map(group => (
          <div key={group.dateLabel}>
            {/* Date separator */}
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-semibold text-muted-foreground">{group.dateLabel}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {group.items.map(comment => {
              const isMe = comment.participant_id === myParticipantId
              return (
                <div
                  key={comment.id}
                  className={cn('flex gap-2 mb-2', isMe ? 'flex-row-reverse' : 'flex-row')}
                >
                  {/* Avatar initial */}
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0 mt-auto mb-0.5">
                      {comment.participant_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className={cn('max-w-[75%] group', isMe ? 'items-end' : 'items-start')}>
                    {/* Name + time */}
                    {!isMe && (
                      <span className="text-[10px] font-semibold text-muted-foreground mb-0.5 block ml-1">
                        {comment.participant_name}
                      </span>
                    )}

                    <div className="flex items-end gap-1.5">
                      {/* Delete button (mine only) */}
                      {isMe && (
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      <div className={cn(
                        'px-3 py-2 rounded-[14px] text-[13px] leading-snug',
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-[4px]'
                          : 'bg-muted text-foreground rounded-bl-[4px]'
                      )}>
                        <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                        <span className={cn(
                          'text-[10px] block mt-1',
                          isMe ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'
                        )}>
                          {formatTime(comment.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {myParticipantId && (
        <div className="flex items-end gap-2 p-3 border-t border-border">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Kommentar schreiben…"
            rows={1}
            maxLength={500}
            className="flex-1 px-3.5 py-2 rounded-[12px] bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-[13px] placeholder:text-muted-foreground/60 resize-none max-h-[120px]"
            style={{ minHeight: '38px' }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
              text.trim() && !sending
                ? 'bg-primary text-primary-foreground active:scale-90'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Send className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}
