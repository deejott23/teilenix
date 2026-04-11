'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, ChevronDown } from 'lucide-react'

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

export default function FeedbackAdminList({ comments: initial }: { comments: Comment[] }) {
  const [comments, setComments] = useState(initial)
  const [filter, setFilter] = useState<string>('all')

  async function updateStatus(id: string, status: string) {
    setComments(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    await fetch(`/api/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  const grouped = comments
    .filter(c => filter === 'all' || c.status === filter)
    .reduce<Record<string, Comment[]>>((acc, c) => {
      const key = c.feature_label ?? 'Allgemein'
      acc[key] = [...(acc[key] ?? []), c]
      return acc
    }, {})

  const filterBtns = [
    { value: 'all', label: 'Alle' },
    { value: 'offen', label: 'Offen' },
    { value: 'in_arbeit', label: 'In Arbeit' },
    { value: 'umgesetzt', label: 'Umgesetzt' },
  ]

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {filterBtns.map(btn => (
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

      {Object.keys(grouped).length === 0 && (
        <p className="text-slate-400 text-sm py-8 text-center">Keine Einträge</p>
      )}

      {Object.entries(grouped).map(([feature, items]) => (
        <div key={feature} className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{feature}</h2>
          {items.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-slate-800 flex-1 whitespace-pre-wrap">{c.comment}</p>
                <StatusBadge status={c.status} id={c.id} onUpdate={updateStatus} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{c.tester_name ?? c.tester_email}</span>
                <span>·</span>
                <span>{new Date(c.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span>·</span>
                <span className="font-mono text-slate-300">{c.page_path}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
