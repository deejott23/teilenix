import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import FamilyMemberList from '@/components/family/FamilyMemberList'
import FamilyInviteCode from '@/components/family/FamilyInviteCode'
import FamilySettingsForm from '@/components/family/FamilySettingsForm'

export default async function FamilyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!familyMember) redirect('/onboarding')

  const { data: family } = await supabase
    .from('families')
    .select('id, name, default_shares, invite_code')
    .eq('id', familyMember.family_id)
    .single()

  if (!family) redirect('/onboarding')

  const { data: members } = await supabase
    .from('family_members')
    .select('id, role, joined_at, profiles(id, display_name, avatar_url, email)')
    .eq('family_id', family.id)
    .order('joined_at', { ascending: true })

  return (
    <div className="space-y-6">
      <PageHeader title="Meine Familie" />

      <div className="bg-gradient-to-r from-primary/10 to-emerald-50 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {(family.name as string).charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{family.name as string}</h2>
            <p className="text-sm text-gray-500">{family.default_shares as number} Personen (Standardanteile)</p>
          </div>
        </div>
      </div>

      {familyMember.role === 'admin' && (
        <FamilySettingsForm
          familyId={family.id as string}
          currentName={family.name as string}
          currentShares={family.default_shares as number}
        />
      )}

      <FamilyInviteCode inviteCode={family.invite_code as string} />

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Mitglieder ({(members ?? []).length})
        </h3>
        <FamilyMemberList
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          members={(members ?? []) as any}
          currentUserId={user.id}
          isAdmin={familyMember.role === 'admin'}
        />
      </div>
    </div>
  )
}
