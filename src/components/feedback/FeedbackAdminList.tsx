'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, ChevronDown, ThumbsUp, ChevronRight } from 'lucide-react'

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
  { value: 'offen', label: 'Offen', icon: Circle, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { value: 'in_arbeit', label: 'In Arbeit', icon: Clock, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { value: 'umgesetzt', label: 'Umgesetzt', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
]

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
        <div className="absolute top-full mt-1 right-0 z-10 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[130px]">
          {STATUS_OPTIONS.map(opt => {
            const OptIcon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onUpdate(id, opt.value)
                  setOpen(false)
                }}
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
  id,
  likes,
  currentEmail,
  onLike,
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

  // Simple markdown: **bold**, bullet points
  const formatted = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('- ')) {
        return `<li key="${i}" class="ml-4 list-disc">${line.slice(2)}</li>`
      }
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

export default function FeedbackAdminList({
  comments: initial,
  currentEmail,
}: {
  comments: Comment[]
  currentEmail: string
}) {
  const [comments, setComments] = useState(initial)
  const [filter, setFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  async function updateStatus(id: string, status: string) {
    setComments(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    await fetch(`/api/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async function toggleLike(id: string, currentlyLiked: boolean) {
    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id !== id) return c
      const likes = c.likes ?? []
      const newLikes = currentlyLiked
        ? likes.filter(l => l.tester_email !== currentEmail)
        : [...likes, { id: 'temp', feedback_id: id, tester_email: currentEmail }]
      return { ...c, likes: newLikes }
    }))

    await fetch(`/api/feedback/${id}/like`, {
      method: currentlyLiked ? 'DELETE' : 'POST',
    })
  }

  // Collect all distinct categories
  const allCategories = Array.from(
    new Set(comments.map(c => c.category).filter(Boolean) as string[])
  )

  const filtered = comments.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
    return true
  })

  // Sort by like count (desc), then date (desc)
  const sorted = [...filtered].sort((a, b) => {
    const likeDiff = (b.likes?.length ?? 0) - (a.likes?.length ?? 0)
    if (likeDiff !== 0) return likeDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const grouped = sorted.reduce<Record<string, Comment[]>>((acc, c) => {
    const key = c.feature_label ?? 'Allgemein'
    acc[key] = [...(acc[key] ?? []), c]
    return acc
  }, {})

  const statusBtns = [
    { value: 'all', label: 'Alle' },
    { value: 'offen', label: 'Offen' },
    { value: 'in_arbeit', label: 'In Arbeit' },
    { value: 'umgesetzt', label: 'Umgesetzt' },
  ]

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {statusBtns.map(btn => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === btn.value
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      {allCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-slate-400 font-medium">Kategorie:</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
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
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
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

      {Object.keys(grouped).length === 0 && (
        <p className="text-slate-400 text-sm py-8 text-center">Keine Einträge</p>
      )}

      {Object.entries(grouped).map(([feature, items]) => (
        <div key={feature} className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {feature}
            <span className="ml-2 text-slate-300 font-normal normal-case">({items.length})</span>
          </h2>
          {items.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              {/* Category badge */}
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
                  <LikeButton
                    id={c.id}
                    likes={c.likes ?? []}
                    currentEmail={currentEmail}
                    onLike={toggleLike}
                  />
                  <StatusBadge status={c.status} id={c.id} onUpdate={updateStatus} />
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{c.tester_name ?? c.tester_email}</span>
                <span>·</span>
                <span>{new Date(c.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span>·</span>
                <span className="font-mono text-slate-300">{c.page_path}</span>
              </div>

              {c.detail_text && <DetailExpand text={c.detail_text} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
