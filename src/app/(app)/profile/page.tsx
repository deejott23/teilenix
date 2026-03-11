import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import SignOutButton from '@/components/auth/SignOutButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: memberData } = await supabase
    .from('family_members')
    .select('role, family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let familyName: string | null = null
  if (memberData?.family_id) {
    const { data: fam } = await supabase
      .from('families')
      .select('name')
      .eq('id', memberData.family_id)
      .single()
    familyName = fam?.name ?? null
  }

  const displayName = (profile?.display_name as string) ?? 'User'
  const avatarUrl = (profile?.avatar_url as string | null) ?? undefined
  const email = (profile?.email as string) ?? ''
  const role = (memberData?.role as string) ?? null

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">
      <PageHeader title="Profil" />

      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-bold text-gray-900 text-lg">{displayName}</h2>
          <p className="text-sm text-gray-500">{email}</p>
          {familyName && (
            <div className="flex items-center gap-2 mt-1">
              <Badge className="text-xs bg-primary/10 text-primary border-0">
                {familyName}
              </Badge>
              {role === 'admin' && (
                <Badge className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                  Admin
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <SignOutButton />
    </div>
  )
}
