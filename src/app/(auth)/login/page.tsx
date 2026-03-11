import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { MapPin } from 'lucide-react'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TeileniX</h1>
          <p className="mt-2 text-gray-500 text-sm">Reisekosten fair teilen</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Willkommen!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Melde dich an, um Reisekosten mit deiner Gruppe zu teilen.
          </p>

          <GoogleSignInButton />

          <p className="mt-4 text-xs text-gray-400 text-center">
            Mit der Anmeldung akzeptierst du unsere Nutzungsbedingungen.
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { emoji: '✈️', label: 'Reisen planen' },
            { emoji: '💸', label: 'Kosten teilen' },
            { emoji: '🤝', label: 'Fair abrechnen' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
