import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/auth/SignOutButton'
import ProfileNameEditor from '@/components/profile/ProfileNameEditor'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  const displayName = (profile?.display_name as string) ?? 'User'
  const avatarUrl = (profile?.avatar_url as string | null) ?? undefined
  const email = (profile?.email as string) ?? ''

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">

      {/* Teal header */}
      <div className="-mx-4 -mt-7 mb-2 px-6 pt-8 pb-6 rounded-b-3xl" style={{ background: 'linear-gradient(150deg, #1b5c58 0%, #134844 100%)' }}>
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14" style={{ outline: '2px solid rgba(255,255,255,0.25)', outlineOffset: '2px' }}>
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="font-bold text-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Profil</p>
            <h1 className="text-xl font-extrabold text-white tracking-tight leading-tight">{displayName}</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{email}</p>
          </div>
        </div>
      </div>

      {/* Profile info card */}
      <div className="bg-card card-shadow rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Kontodaten</h2>
        </div>
        <div className="divide-y divide-border/60">
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Name</p>
            <ProfileNameEditor displayName={displayName} />
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">E-Mail</p>
            <p className="text-sm font-medium text-foreground">{email}</p>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">Wird über Google verwaltet</p>
          </div>
        </div>
      </div>

      <SignOutButton />
    </div>
  )
}
