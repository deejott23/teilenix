'use client'

import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/queryKeys'
import { toast } from 'sonner'
import { z } from 'zod'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import SplitOverrideEditor from './SplitOverrideEditor'
import CategoryIcon from './CategoryIcon'
import { categoryLabels, categoryEmoji, parseToCents, formatCurrency, todayISO } from '@/lib/formatting'
import type { TripParticipant, ExpenseSplitInput, ExpenseFormData } from '@/types/app'
import type { ExpenseCategory } from '@/types/app'
import type { CustomCategory } from '@/components/trips/TripCategorySettings'
import { enqueueRequest, registerOnlineQueueProcessor } from '@/lib/offline-queue'

const ALL_STANDARD_CATEGORIES: ExpenseCategory[] = [
  'food', 'transport', 'accommodation', 'activities', 'shopping', 'health', 'other'
]

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: [
    'pizza', 'burger', 'restaurant', 'essen', 'abendessen', 'mittagessen', 'frühstück',
    'café', 'cafe', 'coffee', 'kaffee', 'bar', 'bier', 'wein', 'winery', 'supermarkt',
    'rewe', 'lidl', 'aldi', 'edeka', 'spar', 'snack', 'döner', 'pasta', 'sushi',
    'brunch', 'tapas', 'kebab', 'eis', 'ice cream', 'bäckerei', 'metzger', 'markt',
    'speise', 'küche', 'gasthaus', 'wirtshaus', 'trattoria', 'bistro', 'food',
  ],
  transport: [
    'taxi', 'uber', 'lyft', 'bolt', 'bahn', 'bus', 'tram', 'metro', 'u-bahn',
    'flug', 'fliegen', 'flugticket', 'zug', 'ticket', 'fahrt', 'mietwagen',
    'parkhaus', 'parken', 'parkplatz', 'tanken', 'benzin', 'sprit', 'diesel',
    'fähre', 'ferry', 'shuttle', 'transfer', 'blablacar', 'mietwagen', 'rental',
    'airport', 'flughafen', 'bahnhof', 'öpnv', 'fahrrad', 'bike', 'scooter',
  ],
  accommodation: [
    'hotel', 'hostel', 'airbnb', 'unterkunft', 'wohnung', 'apartment', 'motel',
    'pension', 'hütte', 'villa', 'resort', 'booking', 'zimmer', 'übernachtung',
    'b&b', 'bed', 'breakfast', 'camping', 'campingplatz', 'stellplatz',
  ],
  activities: [
    'museum', 'tour', 'eintritt', 'aktivität', 'führung', 'ausflug', 'konzert',
    'show', 'theater', 'kino', 'zoo', 'kletter', 'tauchen', 'surfen', 'skipass',
    'spa', 'massage', 'wellness', 'ticket', 'event', 'festival', 'guided',
    'sightseeing', 'besichtigung', 'bootstour', 'kayak', 'rafting', 'safari',
    'golf', 'tennis', 'kurs', 'workshop', 'escape', 'freizeitpark',
  ],
  shopping: [
    'souvenir', 'geschenk', 'shopping', 'kleidung', 'shop', 'boutique', 'laden',
    'zara', 'h&m', 'primark', 'outlet', 'kaufhaus', 'drogerie', 'apotheke',
    'elektronik', 'buchhandlung', 'buchladen',
  ],
  health: [
    'apotheke', 'arzt', 'medizin', 'arztbesuch', 'krankenhaus', 'zahnarzt',
    'dm', 'rossmann', 'müller', 'tabletten', 'pflaster', 'salbe', 'rezept',
    'praxis', 'klinik', 'notaufnahme', 'pharmacy',
  ],
}

function suggestCategory(title: string): string | null {
  const lower = title.toLowerCase().trim()
  if (!lower) return null
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return cat
  }
  return null
}

function parseCustomCats(raw: string[]): CustomCategory[] {
  return raw.flatMap(s => { try { return [JSON.parse(s) as CustomCategory] } catch { return [] } })
}

const formSchema = z.object({
  title:       z.string().min(1, 'Titel erforderlich').max(100),
  amount:      z.string().min(1, 'Betrag erforderlich'),
  expenseDate: z.string(),
})

type FormData = z.infer<typeof formSchema>

interface ExpenseFormProps {
  tripId: string
  participants: TripParticipant[]
  myParticipantId: string
  expenseId?: string
  initialData?: ExpenseFormData
  enabledCategories?: string[]
  customCategoriesRaw?: string[]
}

export default function ExpenseForm({
  tripId, participants, myParticipantId, expenseId,
  initialData, enabledCategories, customCategoriesRaw = []
}: ExpenseFormProps) {
  const customCats = parseCustomCats(customCategoriesRaw)
  // Separate overrides (renamed standard categories) from true custom categories
  const standardOverrides = new Map(customCats.filter(c => c.isOverride).map(c => [c.key, c]))
  const trueCustomCats = customCats.filter(c => !c.isOverride)

  const standardVisible = enabledCategories
    ? ALL_STANDARD_CATEGORIES.filter(c => enabledCategories.includes(c))
    : ALL_STANDARD_CATEGORIES
  const enabledCustom = enabledCategories
    ? trueCustomCats.filter(c => enabledCategories.includes(c.key))
    : trueCustomCats

  // Helper: get label for a standard category (respects user rename)
  const getStandardLabel = (key: string) =>
    standardOverrides.get(key)?.label ?? categoryLabels[key as ExpenseCategory] ?? key
  const getStandardEmoji = (key: string) =>
    standardOverrides.get(key)?.emoji ?? categoryEmoji[key as ExpenseCategory] ?? '📦'

  const router       = useRouter()
  const queryClient  = useQueryClient()
  const isEdit       = !!expenseId

  // Splits: groups + standalone individuals (not individual group members)
  const billableParticipants = participants.filter(p => !p.group_id)
  // Payer options: only groups and standalone individuals — group members are never payers
  const payerOptions = participants.filter(p => p.is_group || !p.group_id)
  const participantLookup = new Map(participants.map(p => [p.id, p]))

  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.category ?? 'other')
  // Track whether current category was set by auto-suggestion (vs manual pick)
  const categoryManuallySet = useRef(!!initialData?.category)
  const [autoSuggested, setAutoSuggested] = useState(false)

  const pickCategory = (cat: string) => {
    categoryManuallySet.current = true
    setAutoSuggested(false)
    setSelectedCategory(cat)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!categoryManuallySet.current) {
      const suggested = suggestCategory(e.target.value)
      if (suggested) {
        setSelectedCategory(suggested)
        setAutoSuggested(true)
      } else {
        setAutoSuggested(false)
      }
    }
  }
  const [splitMode, setSplitMode] = useState<'all' | 'custom'>(
    initialData?.splitMode === 'custom' ? 'custom' : 'all'
  )

  // Erweiterte Optionen: beim Erstellen eingeklappt, beim Bearbeiten mit nicht-Standard-Einstellungen aufgeklappt
  const [showAdvanced, setShowAdvanced] = useState(
    isEdit && (
      (initialData?.splitMode === 'custom') ||
      ((initialData?.coPayers?.length ?? 0) > 0)
    )
  )
  const [splits, setSplits] = useState<ExpenseSplitInput[]>(() => {
    if (initialData?.splits && initialData.splits.length > 0) {
      return billableParticipants.map(p => {
        const existing = initialData.splits.find(s => s.participantId === p.id)
        return existing ?? { participantId: p.id, participantName: p.name, shares: p.shares, included: false }
      })
    }
    return billableParticipants.map(p => ({
      participantId: p.id, participantName: p.name, shares: p.shares, included: true,
    }))
  })

  // Multi-payer state — if current user belongs to a group, default to the group
  const myParticipant = participants.find(p => p.id === myParticipantId)
  const myEffectiveId = myParticipant?.group_id ?? myParticipantId
  const initialPayerId = initialData?.paidByParticipantId ?? myEffectiveId
  const initialCoPayerIds = (initialData?.coPayers ?? []).map(cp => cp.participant_id)
  const [payerIds, setPayerIds] = useState<string[]>([initialPayerId, ...initialCoPayerIds])
  // payerAmounts: euro string per payer, only used when multiple payers selected
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    ;(initialData?.coPayers ?? []).forEach(cp => {
      init[cp.participant_id] = (cp.amount_cents / 100).toFixed(2).replace('.', ',')
    })
    return init
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title:       initialData?.title       ?? '',
      amount:      initialData?.amountEuros ?? '',
      expenseDate: initialData?.expenseDate ?? todayISO(),
    },
  })

  /** Distribute totalCents equally across ids, remainder goes to first */
  const distributeEqually = useCallback((ids: string[], total: number): Record<string, string> => {
    if (ids.length === 0 || total <= 0) return {}
    const base = Math.floor(total / ids.length)
    const rem  = total - base * ids.length
    const result: Record<string, string> = {}
    ids.forEach((id, i) => {
      const cents = base + (i === 0 ? rem : 0)
      result[id] = (cents / 100).toFixed(2).replace('.', ',')
    })
    return result
  }, [])

  const togglePayer = useCallback((id: string) => {
    const total = parseToCents(form.getValues('amount'))
    setPayerIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev
        const next = prev.filter(p => p !== id)
        // Re-distribute remaining payers equally when total is known
        if (total > 0) setPayerAmounts(distributeEqually(next, total))
        else setPayerAmounts(a => { const n = { ...a }; delete n[id]; return n })
        return next
      }
      const next = [...prev, id]
      // Auto-distribute equally as soon as a second payer is added
      if (total > 0) setPayerAmounts(distributeEqually(next, total))
      else setPayerAmounts(a => ({ ...a, [id]: '' }))
      return next
    })
  }, [distributeEqually, form])

  const splitEqually = useCallback(() => {
    const total = parseToCents(form.getValues('amount'))
    if (!total || payerIds.length < 2) return
    setPayerAmounts(distributeEqually(payerIds, total))
  }, [payerIds, form, distributeEqually])

  const watchedAmount = form.watch('amount')
  const totalCents    = parseToCents(watchedAmount)

  const payerTotal = payerIds.length > 1
    ? payerIds.reduce((s, id) => s + parseToCents(payerAmounts[id] ?? '0'), 0)
    : totalCents
  const payerTotalOk = payerIds.length === 1 || payerTotal === totalCents

  const onSubmit = async (data: FormData) => {
    const amountCents = parseToCents(data.amount)
    if (amountCents <= 0) {
      toast.error('Bitte gib einen gültigen Betrag ein')
      return
    }

    // Validate multi-payer amounts
    if (payerIds.length > 1) {
      if (payerTotal !== amountCents) {
        toast.error(`Beträge müssen in Summe ${formatCurrency(amountCents)} ergeben`)
        return
      }
    }

    // Aktive Splits bestimmen
    const rawSplits = splitMode === 'all'
      ? splits
      : splits.filter(s => s.included)

    if (rawSplits.length === 0) {
      toast.error('Mindestens ein Teilnehmer muss beteiligt sein')
      return
    }

    // Feste Beträge validieren
    const fixedSplits = rawSplits.filter(s => s.overrideAmountCents != null)
    const shareBasedSplits = rawSplits.filter(s => s.overrideAmountCents == null)
    const fixedTotal = fixedSplits.reduce((s, sp) => s + (sp.overrideAmountCents ?? 0), 0)
    const remainingCents = amountCents - fixedTotal

    if (fixedTotal > amountCents) {
      toast.error(`Fixe Beträge (${formatCurrency(fixedTotal)}) überschreiten den Gesamtbetrag`)
      return
    }

    // Konvertiere in cent-basierte shares für die API:
    // Fixer Betrag → shares = overrideAmountCents (in Cent)
    // Anteil-basiert → shares = Anteil am verbleibenden Betrag (skaliert auf Cent)
    const totalSharesBase = shareBasedSplits.reduce((s, sp) => s + sp.shares, 0)
    const activeSplits = rawSplits.map(s => {
      if (s.overrideAmountCents != null) {
        return { participantId: s.participantId, shares: s.overrideAmountCents }
      }
      // Wenn alle Splits fix sind (kein share-basierter übrig), fallback auf gleiche Teile
      if (totalSharesBase === 0 || remainingCents <= 0) {
        return { participantId: s.participantId, shares: s.shares }
      }
      return {
        participantId: s.participantId,
        shares: Math.round(remainingCents * s.shares / totalSharesBase),
      }
    })

    // Build co-payers (all except the first/primary)
    const coPayers = payerIds.length > 1
      ? payerIds.slice(1).map(id => ({
          participantId: id,
          amountCents: parseToCents(payerAmounts[id] ?? '0'),
        }))
      : []

    try {
      const url    = isEdit ? `/api/expenses/${expenseId}` : '/api/expenses'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          paidByParticipantId: payerIds[0],
          coPayers: coPayers.length > 0 ? coPayers : [],
          title:       data.title,
          amountCents,
          category:    selectedCategory,
          expenseDate: data.expenseDate,
          splitMode:   splitMode === 'all' ? 'proportional' : 'custom',
          splits:      activeSplits,
          currency:    'EUR',
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Fehler')
      }

      toast.success(isEdit ? 'Ausgabe aktualisiert!' : 'Ausgabe gespeichert!')
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.withSplits(tripId) })
      // Next.js Router-Cache für Trip-Übersicht invalidieren (Balance-Karte aktualisieren)
      fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `/trips/${tripId}` }),
      }).catch(() => {}) // fire-and-forget
      router.push(`/trips/${tripId}/expenses`)
    } catch (e: unknown) {
      const isNetworkError = e instanceof TypeError && e.message.toLowerCase().includes('fetch')
      if (isNetworkError && !isEdit) {
        // Offline: queue the expense for later sync
        enqueueRequest('/api/expenses', {
          tripId,
          paidByParticipantId: payerIds[0],
          coPayers: coPayers.length > 0 ? coPayers : [],
          title:       data.title,
          amountCents,
          category:    selectedCategory,
          expenseDate: data.expenseDate,
          splitMode:   splitMode === 'all' ? 'proportional' : 'custom',
          splits:      activeSplits,
          currency:    'EUR',
        })
        registerOnlineQueueProcessor((count) => {
          toast.success(`${count} Ausgabe${count > 1 ? 'n' : ''} synchronisiert`)
          queryClient.invalidateQueries({ queryKey: queryKeys.expenses.withSplits(tripId) })
        })
        toast.warning('Offline gespeichert – wird automatisch synchronisiert sobald du wieder online bist')
        router.push(`/trips/${tripId}/expenses`)
      } else {
        toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern')
      }
    }
  }

  // Compute per-split amounts for the "all" mode display
  const activeSplitsForAmount = splitMode === 'all' ? splits : splits.filter(s => s.included)
  const totalShares = activeSplitsForAmount.reduce((s, sp) => s + sp.shares, 0)

  const fieldLabel = 'text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block'

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

      {/* CARD 1: Was + Betrag + Datum + Kategorie */}
      <div className="bg-card rounded-2xl p-4 space-y-4 border border-border">

        <div>
          <label htmlFor="title" className={fieldLabel}>Was wurde bezahlt?</label>
          <Input
            id="title"
            placeholder="z.B. Abendessen am Hafen"
            className="h-11 text-base"
            autoFocus={!isEdit}
            {...form.register('title', { onChange: handleTitleChange })}
          />
          {form.formState.errors.title && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="amount" className={fieldLabel}>Betrag</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">€</span>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                className="pl-7 h-11 text-lg font-bold"
                {...form.register('amount')}
              />
            </div>
            {form.formState.errors.amount && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.amount.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="expenseDate" className={fieldLabel}>Datum</label>
            <Input id="expenseDate" type="date" className="h-11 text-sm" {...form.register('expenseDate')} />
          </div>
        </div>

        <div>
          <label className={fieldLabel}>
            Kategorie
            <span className="ml-1.5 text-primary normal-case tracking-normal font-semibold">
              · {getStandardLabel(selectedCategory) !== selectedCategory
                  ? getStandardLabel(selectedCategory)
                  : enabledCustom.find(c => c.key === selectedCategory)?.label ?? selectedCategory}
            </span>
            {autoSuggested && (
              <span className="ml-2 text-[10px] text-muted-foreground/70 font-normal normal-case tracking-normal">
                ✦ Vorschlag
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {standardVisible.map(cat => (
              <button key={cat} type="button" onClick={() => pickCategory(cat)} title={getStandardLabel(cat)}
                className={`relative flex-shrink-0 rounded-xl transition-[transform,box-shadow] duration-100 active:scale-90 ${
                  selectedCategory === cat ? 'scale-105 ring-2 ring-primary ring-offset-1' : 'hover:scale-105'
                }`}
              >
                <CategoryIcon category={cat} size="sm" />
              </button>
            ))}
            {enabledCustom.map(cat => (
              <button key={cat.key} type="button" onClick={() => pickCategory(cat.key)} title={cat.label}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 bg-muted transition-[colors,transform] duration-100 active:scale-90 ${
                  selectedCategory === cat.key ? 'ring-2 ring-primary ring-offset-1 scale-105' : 'hover:bg-muted/80'
                }`}
              >{cat.emoji}</button>
            ))}
          </div>
        </div>

      </div>

      {/* CARD 2: Bezahlt von + Aufteilung */}
      <div className="bg-card rounded-2xl p-4 space-y-4 border border-border">

        {/* Paid by */}
        <div>
          <label className={fieldLabel}>
            Bezahlt von
            {showAdvanced && (
              <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/60">
                · mehrere möglich
              </span>
            )}
          </label>

          {/* Einfach-Modus: einzelne Auswahl */}
          {!showAdvanced && (
            <div className="flex flex-wrap gap-2">
              {payerOptions.map(p => {
                const isSelected = payerIds[0] === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayerIds([p.id])}
                    className={`px-3 py-1.5 rounded-xl border text-sm font-semibold transition-[colors,transform] duration-100 active:scale-95 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {p.name}
                  </button>
                )
              })}
            </div>
          )}

          {/* Erweitert: Mehrfach-Auswahl */}
          {showAdvanced && (
            <div className="flex flex-wrap gap-2">
              {payerOptions.map(p => {
                const isSelected = payerIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePayer(p.id)}
                    className={`px-3 py-1.5 rounded-xl border text-sm font-semibold transition-[colors,transform] duration-100 active:scale-95 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {p.name}
                  </button>
                )
              })}
            </div>
          )}

          {/* Multi-Zahler-Beträge — nur in erweitert + >1 Zahler */}
          {showAdvanced && payerIds.length > 1 && (() => {
            const PAYER_COLORS = ['#1E6FD9', '#2d8a84', '#4ab5ae', '#7dd1cc', '#b2e8e5']
            const remainder = totalCents - payerTotal
            return (
              <div className="mt-3 space-y-2">
                {totalCents > 0 && (
                  <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                    {payerIds.map((id, i) => {
                      const cents = parseToCents(payerAmounts[id] ?? '0')
                      const pct = Math.max(0, cents / totalCents * 100)
                      return (
                        <div key={id} style={{ width: `${pct}%`, background: PAYER_COLORS[i % PAYER_COLORS.length], transition: 'width 0.2s' }} />
                      )
                    })}
                    {remainder > 0 && <div style={{ flex: 1, background: 'hsl(var(--muted))' }} />}
                  </div>
                )}
                <div className="bg-muted/50 rounded-xl overflow-hidden divide-y divide-border/40">
                  {payerIds.map((id, i) => {
                    const p = participantLookup.get(id)
                    if (!p) return null
                    const cents = parseToCents(payerAmounts[id] ?? '0')
                    const pct = totalCents > 0 && cents > 0 ? Math.round(cents / totalCents * 100) : 0
                    return (
                      <div key={id} className="flex items-center gap-2.5 px-3 py-2.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PAYER_COLORS[i % PAYER_COLORS.length] }} />
                        <span className="flex-1 text-sm font-medium text-foreground truncate">{p.name}</span>
                        <span className="text-[11px] text-muted-foreground w-8 text-right tabular-nums flex-shrink-0">{pct > 0 ? `${pct}%` : ''}</span>
                        <div className="relative flex-shrink-0">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={payerAmounts[id] ?? ''}
                            onChange={e => setPayerAmounts(prev => ({ ...prev, [id]: e.target.value }))}
                            className="h-8 w-24 text-sm text-right pr-6 font-semibold bg-background border border-border rounded-lg focus:outline-none focus:border-primary/60 text-foreground"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">€</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between px-0.5">
                  <button type="button" onClick={splitEqually} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    Gleich aufteilen
                  </button>
                  {payerTotalOk ? (
                    <span className="text-xs font-semibold text-primary">✓ Aufgeteilt</span>
                  ) : totalCents > 0 ? (
                    <span className="text-xs font-semibold text-destructive">
                      {remainder > 0 ? `noch ${formatCurrency(remainder)}` : `${formatCurrency(-remainder)} zu viel`}
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Einfach-Modus: Aufteilungs-Zusammenfassung */}
        {!showAdvanced && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
            <span className="text-sm leading-none">🔀</span>
            <span className="text-xs text-muted-foreground">
              Wird gleichmäßig auf alle {billableParticipants.length} Personen aufgeteilt
            </span>
          </div>
        )}

        {/* Erweitert: Aufteilungs-Sektion */}
        {showAdvanced && (
          <>
            <div className="border-t border-border" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={fieldLabel + ' mb-0'}>Aufteilung</label>
                <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
                  {(['all', 'custom'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSplitMode(mode)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-[colors,transform] duration-100 active:scale-90 ${
                        splitMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}
                    >
                      {mode === 'all' ? 'Alle' : 'Individuell'}
                    </button>
                  ))}
                </div>
              </div>

              {splitMode === 'all' ? (
                <>
                  <p className="text-xs text-muted-foreground/75 mb-2.5 flex items-center gap-1.5">
                    <span>💡</span>
                    Gleichmäßige Aufteilung reicht für die meisten Fälle aus
                  </p>
                  <div className="bg-muted rounded-xl px-3 py-2 space-y-1.5">
                    {splits.map(split => {
                      const amt = totalShares > 0 && totalCents > 0
                        ? Math.round(totalCents * split.shares / totalShares)
                        : 0
                      return (
                        <div key={split.participantId} className="flex items-center justify-between text-sm">
                          <span className="text-foreground font-medium">{split.participantName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{split.shares} Anteile</span>
                            {amt > 0 && (
                              <span className="text-xs font-semibold text-foreground font-mono w-16 text-right">
                                {formatCurrency(amt)}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <SplitOverrideEditor splits={splits} onChange={setSplits} totalCents={totalCents} />
              )}
            </div>
          </>
        )}

        {/* Erweiterte Optionen: Auf-/Zuklappen */}
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted/80"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
          {showAdvanced ? 'Weniger Optionen' : 'Erweiterte Optionen'}
        </button>

      </div>

      <Button
        type="submit"
        className="w-full h-11 font-semibold"
        disabled={form.formState.isSubmitting || (payerIds.length > 1 && !payerTotalOk)}
      >
        {form.formState.isSubmitting ? 'Wird gespeichert...' : isEdit ? 'Änderungen speichern' : 'Ausgabe speichern'}
      </Button>
    </form>
  )
}
