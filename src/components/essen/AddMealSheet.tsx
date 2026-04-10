'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const FOOD_EMOJIS = ['🍝', '🥗', '🥩', '🍕', '🍔', '🌮', '🥘', '🍲', '🥞', '🍗', '🍜', '🍣', '🥙', '🫕', '🥪']
const TAGS = ['vegetarisch', 'vegan', 'schnell', 'aufwändig', 'süß', 'herzhaft']

interface AddMealSheetProps {
  onClose: () => void
  onAdd: (data: object) => Promise<void>
}

export default function AddMealSheet({ onClose, onAdd }: AddMealSheetProps) {
  const [emoji, setEmoji] = useState('🍽️')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [link, setLink] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onAdd({
        emoji,
        title: title.trim(),
        description: description.trim() || null,
        tags,
        link: link.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full bg-card rounded-t-3xl max-h-[92vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <h2 className="text-[17px] font-bold text-foreground">Essens-Idee vorschlagen</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-28 space-y-5">
          {/* Emoji picker */}
          <div>
            <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {FOOD_EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-xl text-[22px] border-2 transition-all',
                    emoji === e
                      ? 'border-amber-500 bg-amber-50 scale-110'
                      : 'border-transparent bg-muted hover:bg-muted/80'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[13px] text-muted-foreground">Aktuell:</span>
              <span className="text-[24px]">{emoji}</span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Pasta Bolognese"
              required
              maxLength={120}
              className="w-full px-3.5 py-2.5 rounded-[12px] bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 text-[14px] placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Beschreibung (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Warum ist das eine gute Idee? Besonderheiten?"
              rows={2}
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-[12px] bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 text-[14px] placeholder:text-muted-foreground/60 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-[12px] font-semibold border-[1.5px] transition-all',
                    tags.includes(tag)
                      ? 'bg-amber-100 border-amber-500 text-amber-800'
                      : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="block text-[12px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Link (optional)
            </label>
            <input
              type="url"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://rezept-link..."
              className="w-full px-3.5 py-2.5 rounded-[12px] bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 text-[14px] placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className={cn(
              'w-full py-3 rounded-[14px] font-bold text-[15px] transition-all active:scale-[0.98]',
              submitting || !title.trim()
                ? 'bg-muted text-muted-foreground'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            )}
          >
            {submitting ? 'Wird hinzugefügt…' : 'Idee vorschlagen 🍽️'}
          </button>
        </form>
      </div>
    </div>
  )
}
