import { Crown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/formatting'

interface Member {
  id: string
  role: string
  joined_at: string
  profiles: {
    id: string
    display_name: string
    avatar_url: string | null
    email: string
  } | null
}

interface FamilyMemberListProps {
  members: Member[]
  currentUserId: string
  isAdmin: boolean
}

export default function FamilyMemberList({ members, currentUserId }: FamilyMemberListProps) {
  return (
    <div className="space-y-2">
      {members.map(member => {
        const profile = member.profiles
        if (!profile) return null

        const initials = profile.display_name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)

        return (
          <div
            key={member.id}
            className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-gray-800 text-sm truncate">{profile.display_name}</p>
                {profile.id === currentUserId && (
                  <span className="text-xs text-gray-400">(du)</span>
                )}
                {member.role === 'admin' && (
                  <Crown className="w-3.5 h-3.5 text-yellow-500" />
                )}
              </div>
              <p className="text-xs text-gray-400">Beigetreten: {formatDate(member.joined_at)}</p>
            </div>

            {member.role === 'admin' && (
              <Badge className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50">
                Admin
              </Badge>
            )}
          </div>
        )
      })}
    </div>
  )
}
