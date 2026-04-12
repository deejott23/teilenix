'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, X, Send, CheckCircle, List } from 'lucide-react'
import { featureLabelFromPath } from '@/lib/tester'

export default function FeedbackFab() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const featureLabel = featureLabelFromPath(pathname)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return

    setLoading(true)
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_path: pathname,
        feature_label: featureLabel,
        comment,
        category: null,
        detail_text: null,
      }),
    })
    setLoading(false)

    if (res.ok) {
      setDone(true)
      setComment('')
      setTimeout(() => {
        setDone(false)
        setOpen(false)
      }, 1800)
    }
  }

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[84px] left-4 md:bottom-6 md:left-6 z-40 w-12 h-12 rounded-full bg-slate-700 text-white shadow-lg flex items-center justify-center hover:bg-slate-600 active:scale-95 transition-all"
        aria-label="Feedback hinterlassen"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Dialog */}
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Feedback hinterlassen</p>
                <p className="text-xs text-slate-500 mt-0.5">Seite: <span className="font-medium text-slate-700">{featureLabel}</span></p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-2 py-4 text-green-600">
                <CheckCircle className="w-8 h-8" />
                <p className="font-medium">Feedback gespeichert!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Was ist dir aufgefallen? Fehler, Verbesserungsideen, Fragen…"
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || !comment.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-slate-700 active:scale-[0.98] transition-all"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Wird gespeichert…' : 'Absenden'}
                </button>
                <Link
                  href="/feedback"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center gap-2 text-slate-500 text-xs py-1.5 hover:text-slate-700 transition-colors"
                >
                  <List className="w-3.5 h-3.5" />
                  Alle Kommentare ansehen
                </Link>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
