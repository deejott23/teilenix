'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Users, Plus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createFamilySchema, joinFamilySchema, type CreateFamilyInput, type JoinFamilyInput } from '@/lib/validations/family'

export default function OnboardingClient({ userName }: { userName: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createForm = useForm<CreateFamilyInput>({
    resolver: zodResolver(createFamilySchema) as any,
    defaultValues: { name: '', defaultShares: 2 },
  })

  const joinForm = useForm<JoinFamilyInput>({
    resolver: zodResolver(joinFamilySchema),
    defaultValues: { inviteCode: '' },
  })

  const handleCreate = async (data: CreateFamilyInput) => {
    try {
      const res = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Fehler beim Erstellen')
      }
      toast.success('Familie erstellt!')
      router.push('/dashboard')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    }
  }

  const handleJoin = async (data: JoinFamilyInput) => {
    try {
      const res = await fetch('/api/families/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Einladungscode ungültig')
      }
      toast.success('Familie beigetreten!')
      router.push('/dashboard')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    }
  }

  if (mode === 'choose') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Willkommen, {userName}!</h1>
            <p className="mt-2 text-gray-500 text-sm">
              Erstelle deine Familie oder tritt einer bestehenden bei.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-primary hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Familie erstellen</p>
                  <p className="text-sm text-gray-500">Neu anfangen und andere einladen</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-primary hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <LogIn className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Familie beitreten</p>
                  <p className="text-sm text-gray-500">Einladungscode eingeben</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="max-w-sm mx-auto py-8 px-4">
        <button onClick={() => setMode('choose')} className="text-sm text-gray-500 mb-6 hover:text-gray-700">
          ← Zurück
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Familie erstellen</h1>
        <p className="text-gray-500 text-sm mb-6">
          Gib deiner Familie einen Namen und leg fest, wie viele Personen ihr seid.
        </p>

        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Familienname</Label>
            <Input
              id="name"
              placeholder="z.B. Familie Müller"
              {...createForm.register('name')}
            />
            {createForm.formState.errors.name && (
              <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultShares">Anzahl Personen (Anteile)</Label>
            <Input
              id="defaultShares"
              type="number"
              min={1}
              max={20}
              {...createForm.register('defaultShares', { valueAsNumber: true })}
            />
            <p className="text-xs text-gray-400">
              Bestimmt den Standard-Anteil bei Kostenaufteilungen
            </p>
            {createForm.formState.errors.defaultShares && (
              <p className="text-sm text-destructive">{createForm.formState.errors.defaultShares.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={createForm.formState.isSubmitting}>
            {createForm.formState.isSubmitting ? 'Wird erstellt...' : 'Familie erstellen'}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto py-8 px-4">
      <button onClick={() => setMode('choose')} className="text-sm text-gray-500 mb-6 hover:text-gray-700">
        ← Zurück
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Familie beitreten</h1>
      <p className="text-gray-500 text-sm mb-6">
        Gib den Einladungscode ein, den du von einem Familienmitglied erhalten hast.
      </p>

      <form onSubmit={joinForm.handleSubmit(handleJoin)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="inviteCode">Einladungscode</Label>
          <Input
            id="inviteCode"
            placeholder="z.B. AB3D7F9K"
            className="uppercase tracking-widest font-mono text-center text-lg"
            {...joinForm.register('inviteCode')}
            onChange={e => {
              e.target.value = e.target.value.toUpperCase()
              joinForm.setValue('inviteCode', e.target.value)
            }}
          />
          {joinForm.formState.errors.inviteCode && (
            <p className="text-sm text-destructive">{joinForm.formState.errors.inviteCode.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={joinForm.formState.isSubmitting}>
          {joinForm.formState.isSubmitting ? 'Wird geprüft...' : 'Beitreten'}
        </Button>
      </form>
    </div>
  )
}
