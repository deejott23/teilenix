'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import SplitOverrideEditor from './SplitOverrideEditor'
import CategoryIcon from './CategoryIcon'
import { categoryLabels } from '@/lib/formatting'
import { parseToCents, todayISO } from '@/lib/formatting'
import type { TripFamilyWithFamily, ExpenseSplitInput } from '@/types/app'
import type { ExpenseCategory } from '@/types/database'

const categories: ExpenseCategory[] = [
  'food', 'transport', 'accommodation', 'activities', 'shopping', 'health', 'other'
]

const formSchema = z.object({
  title: z.string().min(1, 'Titel erforderlich').max(100),
  amount: z.string().min(1, 'Betrag erforderlich'),
  category: z.string(),
  expenseDate: z.string(),
  paidByFamilyId: z.string(),
})

type FormData = z.infer<typeof formSchema>

interface ExpenseFormProps {
  tripId: string
  tripFamilies: TripFamilyWithFamily[]
  myFamilyId: string
}

export default function ExpenseForm({ tripId, tripFamilies, myFamilyId }: ExpenseFormProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('other')
  const [splitMode, setSplitMode] = useState<'all' | 'custom'>('all')
  const [splits, setSplits] = useState<ExpenseSplitInput[]>(
    tripFamilies.map(tf => ({
      familyId: tf.family_id,
      familyName: tf.families.name,
      shares: tf.shares,
      included: true,
    }))
  )

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      amount: '',
      category: 'other',
      expenseDate: todayISO(),
      paidByFamilyId: myFamilyId,
    },
  })

  const onSubmit = async (data: FormData) => {
    const amountCents = parseToCents(data.amount)
    if (amountCents <= 0) {
      toast.error('Bitte gib einen gültigen Betrag ein')
      return
    }

    const activeSplits = splitMode === 'all'
      ? splits.map(s => ({ familyId: s.familyId, shares: s.shares }))
      : splits.filter(s => s.included).map(s => ({ familyId: s.familyId, shares: s.shares }))

    if (activeSplits.length === 0) {
      toast.error('Mindestens eine Familie muss beteiligt sein')
      return
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          paidByFamilyId: data.paidByFamilyId,
          title: data.title,
          amountCents,
          category: selectedCategory,
          expenseDate: data.expenseDate,
          splitMode: splitMode === 'all' ? 'proportional' : 'custom',
          splits: activeSplits,
          currency: 'EUR',
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Fehler')
      }

      toast.success('Ausgabe gespeichert!')
      router.push(`/trips/${tripId}/expenses`)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Titel *</Label>
        <Input
          id="title"
          placeholder="z.B. Abendessen am Hafen"
          {...form.register('title')}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Betrag *</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            className="pl-8 text-lg font-semibold"
            {...form.register('amount')}
          />
        </div>
        {form.formState.errors.amount && (
          <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Kategorie</Label>
        <div className="grid grid-cols-4 gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                selectedCategory === cat
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <CategoryIcon category={cat} size="sm" />
              <span className="text-xs text-gray-600 leading-tight text-center">
                {categoryLabels[cat].split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="expenseDate">Datum</Label>
        <Input
          id="expenseDate"
          type="date"
          {...form.register('expenseDate')}
        />
      </div>

      {/* Paid by */}
      <div className="space-y-2">
        <Label>Bezahlt von</Label>
        <div className="flex flex-wrap gap-2">
          {tripFamilies.map(tf => (
            <button
              key={tf.family_id}
              type="button"
              onClick={() => form.setValue('paidByFamilyId', tf.family_id)}
              className={`px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-all ${
                form.watch('paidByFamilyId') === tf.family_id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {tf.families.name}
            </button>
          ))}
        </div>
      </div>

      {/* Split mode */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Aufteilung</Label>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setSplitMode('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                splitMode === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              Alle
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('custom')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                splitMode === 'custom'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              Individuell
            </button>
          </div>
        </div>

        {splitMode === 'all' ? (
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            {splits.map(split => (
              <div key={split.familyId} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{split.familyName}</span>
                <Badge variant="secondary">{split.shares} Anteile</Badge>
              </div>
            ))}
          </div>
        ) : (
          <SplitOverrideEditor splits={splits} onChange={setSplits} />
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Wird gespeichert...' : 'Ausgabe speichern'}
      </Button>
    </form>
  )
}
