import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import InstallBanner from '@/components/pwa/InstallBanner'
import OfflineIndicator from '@/components/pwa/OfflineIndicator'
import { QueryProvider } from '@/providers/QueryProvider'

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TeileniX – Reisekosten teilen',
  description: 'Teile Abenteuer und die Kosten. Reisekosten fair aufteilen für Gruppen.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TeileniX',
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
    'msapplication-TileColor': '#1b5c58',
    'msapplication-TileImage': '/icons/icon-144x144.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1b5c58',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={jakartaSans.variable}>
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
