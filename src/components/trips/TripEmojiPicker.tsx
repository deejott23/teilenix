'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TRIP_EMOJIS = [
  '🌍', '🌴', '🏔️', '🏖️', '🗺️', '🌅', '⛵', '🏕️',
  '✈️', '🚂', '🚗', '🚢', '🗼', '🏰', '🌊', '🎿',
  '🏄', '🧗', '🎭', '🌋', '🏜️', '🎪', '🌺', '🎡',
]

/** Compress image to max 1200px, JPEG 85% */
function compressImage(file: File): Promise<Blob> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1200
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.85)
    }
    img.src = url
  })
}

interface TripEmojiPickerProps {
  tripId: string
  currentEmoji: string
  currentImageUrl?: string | null
  canEdit: boolean
}

export default function TripEmojiPicker({
  tripId, currentEmoji, currentImageUrl, canEdit
}: TripEmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'emoji' | 'foto'>('emoji')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error()
  }

  const pickEmoji = async (emoji: string) => {
    setSaving(true)
    try {
      // Emoji selected → clear image so emoji shows in header
      await patch({ coverEmoji: emoji, coverImageUrl: null })
      router.refresh()
      setOpen(false)
    } catch {
      toast.error('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bild darf maximal 5 MB groß sein')
      return
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    setUploading(true)
    try {
      // Compress client-side
      const compressed = await compressImage(file)

      // Upload to Supabase Storage
      const supabase = createClient()
      const path = `${tripId}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('trip-covers')
        .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('trip-covers')
        .getPublicUrl(path)

      // Save URL to trip, keep emoji (used as badge)
      await patch({ coverImageUrl: publicUrl })
      router.refresh()
      setOpen(false)
      setPreviewUrl(null)
      toast.success('Bild gespeichert')
    } catch (err) {
      console.error(err)
      toast.error('Upload fehlgeschlagen')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeImage = async () => {
    setSaving(true)
    try {
      await patch({ coverImageUrl: null })
      router.refresh()
      setOpen(false)
    } catch {
      toast.error('Fehler beim Entfernen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => canEdit && setOpen(v => !v)}
        disabled={!canEdit}
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all ${
          canEdit ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
        }`}
        style={{ background: 'rgba(255,255,255,0.15)' }}
        title={canEdit ? 'Icon / Bild ändern' : undefined}
      >
        {currentEmoji}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setPreviewUrl(null) }} />

          <div className="fixed left-4 top-24 z-50 bg-card border border-border rounded-2xl shadow-xl w-[248px] overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b border-border">
              {(['emoji', 'foto'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                    tab === t
                      ? 'text-primary border-b-2 border-primary -mb-px bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'emoji' ? '😀 Icon' : '🖼️ Foto'}
                </button>
              ))}
            </div>

            {tab === 'emoji' && (
              <div className="p-3">
                <div className="grid grid-cols-6 gap-1">
                  {TRIP_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => pickEmoji(emoji)}
                      disabled={saving}
                      className={`w-full aspect-square rounded-xl text-lg flex items-center justify-center transition-all ${
                        emoji === currentEmoji && !currentImageUrl
                          ? 'bg-primary/15 ring-2 ring-primary scale-105'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'foto' && (
              <div className="p-3 space-y-3">

                {/* Current image preview */}
                {(previewUrl ?? currentImageUrl) && (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl ?? currentImageUrl!}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                    {!uploading && currentImageUrl && !previewUrl && (
                      <button
                        onClick={removeImage}
                        disabled={saving}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-destructive transition-colors"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                )}

                {/* Upload button */}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || saving}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center gap-1.5 disabled:opacity-50"
                >
                  <ImagePlus className="w-5 h-5 text-muted-foreground" strokeWidth={1.8} />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {currentImageUrl ? 'Bild ersetzen' : 'Bild hochladen'}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    JPG, PNG, WebP · max. 5 MB
                  </span>
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
