'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, ChevronDown, XCircle, ThumbsUp, ChevronRight } from 'lucide-react'

type Like = {
  id: string
  feedback_id: string
  tester_email: string
}

type Comment = {
  id: string
  created_at: string
  page_path: string
  feature_label: string | null
  comment: string
  tester_email: string
  tester_name: string | null
  status: string
  developer_note: string | null
  category: string | null
  detail_text: string | null
  likes?: Like[]
}

const STATUS_OPTIONS = [
  { value: 'offen',          label: 'Offen',          icon: Circle,       color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { value: 'in_arbeit',      label: 'In Arbeit',      icon: Clock,        color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { value: 'umgesetzt',      label: 'Umgesetzt',      icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'nicht_relevant', label: 'Nicht relevant', icon: XCircle,      color: 'text-slate-400 bg-slate-50 border-slate-200' },
]

const ARCHIVED_STATUSES = new Set(['umgesetzt', 'nicht_relevant'])

function authorLabel(c: Comment) {
  return c.tester_name ?? c.tester_email
}

function StatusBadge({ status, id, onUpdate }: { status: string; id: string; onUpdate: (id: string, status: string) => void }) {
  const [open, setOpen] = useState(false)
  const current = STATUS_OPTIONS.find(s => s.value === status) ?? STATUS_OPTIONS[0]
  const Icon = current.icon

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${current.color}`}
      >
        <Icon className="w-3 h-3" />
        {current.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-10 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[150px]">
          {STATUS_OPTIONS.map(opt => {
            const OptIcon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => { onUpdate(id, opt.value); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 ${opt.value === status ? 'bg-slate-50' : ''}`}
              >
                <OptIcon className={`w-3.5 h-3.5 ${opt.color.split(' ')[0]}`} />
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LikeButton({
  id, likes, currentEmail, onLike,
}: {
  id: string
  likes: Like[]
  currentEmail: string
  onLike: (id: string, liked: boolean) => void
}) {
  const liked = likes.some(l => l.tester_email === currentEmail)
  const count = likes.length

  return (
    <button
      onClick={() => onLike(id, liked)}
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
        liked
          ? 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100'
          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
      }`}
      title={liked ? 'Like entfernen' : 'Wichtig — Like vergeben'}
    >
      <ThumbsUp className={`w-3 h-3 ${liked ? 'fill-violet-500 text-violet-500' : ''}`} />
      <span>{count > 0 ? count : ''}</span>
    </button>
  )
}

function DetailExpand({ text }: { text: string }) {
  const [open, setOpen] = useState(false)

  const formatted = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('- ')) return `<li key="${i}" class="ml-4 list-disc">${line.slice(2)}</li>`
      if (line === '') return '<br />'
      return `<p>${line}</p>`
    })
    .join('')

  return (
    <div className="border-t border-slate-100 mt-3 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium"
      >
        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
        {open ? 'Detail ausblenden' : 'Ausführliche Analyse anzeigen'}
      </button>
      {open && (
        <div
          className="mt-2 text-xs text-slate-600 leading-relaxed space-y-1 bg-slate-50 rounded-lg p-3 border border-slate-100"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      )}
    </div>
  )
}

function CommentCard({ c, currentEmail, onUpdate, onLike, dimmed }: {
  c: Comment
  currentEmail: string
  onUpdate: (id: string, status: string) => void
  onLike: (id: string, liked: boolean) => void
  dimmed?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 space-y-3 ${dimmed ? 'border-slate-100 opacity-60' : 'border-slate-100'}`}>
      {c.category && (
        <div className="flex">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 text-violet-500 border border-violet-100">
            {c.category}
          </span>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-800 flex-1 whitespace-pre-wrap">{c.comment}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <LikeButton id={c.id} likes={c.likes ?? []} currentEmail={currentEmail} onLike={onLike} />
          <StatusBadge status={c.status} id={c.id} onUpdate={onUpdate} />
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
        <span>{authorLabel(c)}</span>
        <span>·</span>
        <span>{new Date(c.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span>·</span>
        <span className="font-mono text-slate-300">{c.page_path}</span>
      </div>
      {c.detail_text && <DetailExpand text={c.detail_text} />}
    </div>
  )
}

function GroupedList({ items, currentEmail, onUpdate, onLike, dimmed }: {
  items: Record<string, Comment[]>
  currentEmail: string
  onUpdate: (id: string, status: string) => void
  onLike: (id: string, liked: boolean) => void
  dimmed?: boolean
}) {
  return (
    <>
      {Object.entries(items).map(([feature, cs]) => (
        <div key={feature} className="space-y-3">
          <h2 className={`text-xs font-semibold uppercase tracking-wider ${dimmed ? 'text-slate-300' : 'text-slate-400'}`}>
            {feature}
            <span className="ml-2 font-normal normal-case">({cs.length})</span>
          </h2>
          {cs.map(c => (
            <CommentCard key={c.id} c={c} currentEmail={currentEmail} onUpdate={onUpdate} onLike={onLike} dimmed={dimmed} />
          ))}
        </div>
      ))}
    </>
  )
}

export default function FeedbackAdminList({
  comments: initial,
  currentEmail,
}: {
  comments: Comment[]
  currentEmail: string
}) {
  const [comments, setComments] = useState(initial)
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [authorFilter, setAuthorFilter] = useState<string | null>(null)
  const [archivedOpen, setArchivedOpen] = useState(false)

  async function updateStatus(id: string, status: string) {
    setComments(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    await fetch(`/api/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async function toggleLike(id: string, currentlyLiked: boolean) {
    setComments(prev => prev.map(c => {
      if (c.id !== id) return c
      const likes = c.likes ?? []
      const newLikes = currentlyLiked
        ? likes.filter(l => l.tester_email !== currentEmail)
        : [...likes, { id: 'temp', feedback_id: id, tester_email: currentEmail }]
      return { ...c, likes: newLikes }
    }))
    await fetch(`/api/feedback/${id}/like`, { method: currentlyLiked ? 'DELETE' : 'POST' })
  }

  // Unique categories and authors
  const allCategories = Array.from(new Set(comments.map(c => c.category).filter(Boolean) as string[]))
  const allAuthors = Array.from(new Set(comments.map(authorLabel))).sort()

  // Apply filters
  const filtered = comments.filter(c => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
    if (authorFilter !== null && authorLabel(c) !== authorFilter) return false
    return true
  })

  // Sort by like count (desc), then date (desc)
  const sorted = [...filtered].sort((a, b) => {
    const likeDiff = (b.likes?.length ?? 0) - (a.likes?.length ?? 0)
    if (likeDiff !== 0) return likeDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const toGrouped = (items: Comment[]) =>
    items.reduce<Record<string, Comment[]>>((acc, c) => {
      const key = c.feature_label ?? 'Allgemein'
      acc[key] = [...(acc[key] ?? []), c]
      return acc
    }, {})

  // Split into active vs archived
  let mainItems: Comment[]
  let archiveItems: Comment[]

  if (statusFilter === 'active' || statusFilter === 'all') {
    mainItems = sorted.filter(c => !ARCHIVED_STATUSES.has(c.status))
    archiveItems = sorted.filter(c => ARCHIVED_STATUSES.has(c.status))
  } else {
    mainItems = sorted.filter(c => c.status === statusFilter)
    archiveItems = []
  }

  const mainGrouped = toGrouped(mainItems)
  const archiveGrouped = toGrouped(archiveItems)

  const statusFilterBtns = [
    { value: 'active',         label: 'Aktiv' },
    { value: 'all',            label: 'Alle' },
    { value: 'offen',          label: 'Offen' },
    { value: 'in_arbeit',      label: 'In Arbeit' },
    { value: 'umgesetzt',      label: 'Umgesetzt' },
    { value: 'nicht_relevant', label: 'Nicht relevant' },
  ]

  return (
    <div className="space-y-6">
      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {statusFilterBtns.map(btn => (
          <button
            key={btn.value}
            onClick={() => setStatusFilter(btn.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === btn.value
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      {allCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-slate-400 font-medium">Kategorie:</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              categoryFilter === 'all'
                ? 'bg-violet-700 text-white border-violet-700'
                : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
            }`}
          >
            Alle
          </button>
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                categoryFilter === cat
                  ? 'bg-violet-700 text-white border-violet-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Author filter */}
      {allAuthors.length > 1 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-slate-400 font-medium">Autor:</span>
          <button
            onClick={() => setAuthorFilter(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              authorFilter === null
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}
          >
            Alle
          </button>
          {allAuthors.map(author => (
            <button
              key={author}
              onClick={() => setAuthorFilter(authorFilter === author ? null : author)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                authorFilter === author
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              {author}
            </button>
          ))}
        </div>
      )}

      {/* Main list */}
      {Object.keys(mainGrouped).length === 0 && archiveItems.length === 0 && (
        <p className="text-slate-400 text-sm py-8 text-center">Keine Einträge</p>
      )}

      <GroupedList items={mainGrouped} currentEmail={currentEmail} onUpdate={updateStatus} onLike={toggleLike} />

      {/* Archive section (umgesetzt + nicht_relevant) */}
      {archiveItems.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <button
            onClick={() => setArchivedOpen(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${archivedOpen ? 'rotate-90' : ''}`} />
            Archiviert ({archiveItems.length})
          </button>
          {archivedOpen && (
            <div className="mt-4 space-y-6">
              <GroupedList items={archiveGrouped} currentEmail={currentEmail} onUpdate={updateStatus} onLike={toggleLike} dimmed />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
