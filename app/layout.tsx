import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Daily Tracker — Satu App untuk Habit, Workout, Nutrisi & Keuangan',
    template: '%s · Daily Tracker',
  },
  description:
    'Lacak kebiasaan harian, counting day, workout, nutrisi, dan keuangan (hutang & investasi) dalam satu aplikasi. Sekali bayar Rp20.000, akses selamanya.',
  keywords: [
    'daily tracker',
    'habit tracker Indonesia',
    'aplikasi tracker harian',
    'workout tracker',
    'nutrition tracker',
    'tracker keuangan',
    'tracker hutang',
    'tracker investasi',
  ],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    siteName: 'Daily Tracker',
    title: 'Daily Tracker — Satu App untuk Habit, Workout, Nutrisi & Keuangan',
    description:
      'Lacak kebiasaan harian, workout, nutrisi, dan keuangan dalam satu aplikasi. Sekali bayar Rp20.000, akses selamanya.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Tracker — Satu App untuk Semua Progres Harianmu',
    description: 'Sekali bayar Rp20.000, akses selamanya.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0b0d10',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

// Applied before first paint so a dark-mode user never sees a white flash.
const themeScript = `try {
  var t = localStorage.getItem('daily-tracker:theme') || 'dark'
  document.documentElement.classList.toggle('dark', t === 'dark')
} catch (e) {}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✅</text></svg>"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
