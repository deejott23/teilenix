'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateFamilySchema, type UpdateFamilyInput } from '@/lib/validations/family'
import { createClient } from '@/lib/supabase/client'

interface FamilySettingsFormProps {
  familyId: string
  currentName: string
  currentShares: number
}

export default function FamilySettingsForm({ familyId, currentName, currentShares }: FamilySettingsFormProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)

  const form = useForm<UpdateFamilyInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updateFamilySchema) as any,
    defaultValues: { name: currentName, defaultShares: currentShares },
  })

  const onSubmit = async (data: UpdateFamilyInput) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('families')
      .update({
        name: data.name,
        default_shares: data.defaultShares,
      })
      .eq('id', familyId)

    if (error) {
      toast.error('Fehler beim Speichern')
      return
    }

    toast.success('Familie aktualisiert!')
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setEditing(true)}
        className="w-full"
      >
        Familieneinstellungen bearbeiten
      </Button>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white border border-primary/20 rounded-2xl p-4 space-y-4">
      <h3 className="font-semibold text-gray-800 text-sm">Einstellungen bearbeiten</h3>

      <div className="space-y-2">
        <Label htmlFor="familyName">Name</Label>
        <Input id="familyName" {...form.register('name')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="familyShares">Standardanteile (Personenanzahl)</Label>
        <Input
          id="familyShares"
          type="number"
          min={1}
          max={20}
          {...form.register('defaultShares')}
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(false)}>
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
          Speichern
        </Button>
      </div>
    </form>
  )
}
