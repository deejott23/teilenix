'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Erfolgreich abgemeldet')
    router.push('/login')
  }

  return (
    <Button
      variant="outline"
      className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
      onClick={handleSignOut}
    >
      <LogOut className="w-4 h-4" />
      Abmelden
    </Button>
  )
}
