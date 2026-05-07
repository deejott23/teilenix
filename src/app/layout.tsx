import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import InstallBanner from '@/components/pwa/InstallBanner'
import OfflineIndicator from '@/components/pwa/OfflineIndicator'
import { QueryProvider } from '@/providers/QueryProvider'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'share|pa – Fair teilen. Entspannt reisen.',
  description: 'Fair teilen. Entspannt reisen. Die Gruppenkasse, die einfach funktioniert.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'share|pa',
    startupImage: '/apple-touch-icon.png',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#1E6FD9',
    'msapplication-TileImage': '/sharepa-app-icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1E6FD9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="antialiased min-h-screen bg-background">
        <QueryProvider>
          {children}
          <Toaster position="top-center" richColors />
          <ServiceWorkerRegister />
          <OfflineIndicator />
          <InstallBanner />
        </QueryProvider>
      </body>
    </html>
  )
}
