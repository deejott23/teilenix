'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, ChevronDown, XCircle, ChevronRight } from 'lucide-react'

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

function GroupedList({ items, onUpdate, dimmed }: { items: Record<string, Comment[]>; onUpdate: (id: string, status: string) => void; dimmed?: boolean }) {
  return (
    <>
      {Object.entries(items).map(([feature, cs]) => (
        <div key={feature} className="space-y-3">
          <h2 className={`text-xs font-semibold uppercase tracking-wider ${dimmed ? 'text-slate-300' : 'text-slate-400'}`}>{feature}</h2>
          {cs.map(c => (
            <div key={c.id} className={`bg-white rounded-2xl border shadow-sm p-4 space-y-3 ${dimmed ? 'border-slate-100 opacity-60' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-slate-800 flex-1 whitespace-pre-wrap">{c.comment}</p>
                <StatusBadge status={c.status} id={c.id} onUpdate={onUpdate} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                <span>{authorLabel(c)}</span>
                <span>·</span>
                <span>{new Date(c.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span>·</span>
                <span className="font-mono text-slate-300">{c.page_path}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

export default function FeedbackAdminList({ comments: initial }: { comments: Comment[] }) {
  const [comments, setComments] = useState(initial)
  const [statusFilter, setStatusFilter] = useState<string>('active')
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

  // Unique authors sorted alphabetically
  const authors = Array.from(new Set(comments.map(authorLabel))).sort()

  // Apply author filter
  const filtered = authorFilter
    ? comments.filter(c => authorLabel(c) === authorFilter)
    : comments

  const toGrouped = (items: Comment[]) =>
    items.reduce<Record<string, Comment[]>>((acc, c) => {
      const key = c.feature_label ?? 'Allgemein'
      acc[key] = [...(acc[key] ?? []), c]
      return acc
    }, {})

  const statusFilterBtns = [
    { value: 'active',         label: 'Aktiv' },
    { value: 'all',            label: 'Alle' },
    { value: 'offen',          label: 'Offen' },
    { value: 'in_arbeit',      label: 'In Arbeit' },
    { value: 'umgesetzt',      label: 'Umgesetzt' },
    { value: 'nicht_relevant', label: 'Nicht relevant' },
  ]

  // Determine which items to show in main area vs archive
  let mainItems: Comment[]
  let archiveItems: Comment[]

  if (statusFilter === 'active') {
    mainItems = filtered.filter(c => !ARCHIVED_STATUSES.has(c.status))
    archiveItems = filtered.filter(c => ARCHIVED_STATUSES.has(c.status))
  } else if (statusFilter === 'all') {
    mainItems = filtered.filter(c => !ARCHIVED_STATUSES.has(c.status))
    archiveItems = filtered.filter(c => ARCHIVED_STATUSES.has(c.status))
  } else {
    mainItems = filtered.filter(c => c.status === statusFilter)
    archiveItems = []
  }

  const mainGrouped = toGrouped(mainItems)
  const archiveGrouped = toGrouped(archiveItems)

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

      {/* Author filter */}
      {authors.length > 1 && (
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
          {authors.map(author => (
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

      <GroupedList items={mainGrouped} onUpdate={updateStatus} />

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
              <GroupedList items={archiveGrouped} onUpdate={updateStatus} dimmed />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
