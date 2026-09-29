'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { AnimatePresence, motion } from 'framer-motion'
import { StoreProvider, useStore, type SyncState } from './lib/store'
import { supabase } from './lib/supabase'
import Dashboard from './components/Dashboard'
import TaskChecklist from './components/TaskChecklist'
import DayCounter from './components/DayCounter'
import WorkoutTracker from './components/WorkoutTracker'
import NutritionTracker from './components/NutritionTracker'
import WaterTracker from './components/WaterTracker'
import Finance from './components/Finance'
import History from './components/History'
import { relativeLabel } from './lib/date'

export type TabId =
  | 'dashboard'
  | 'tasks'
  | 'counter'
  | 'workout'
  | 'nutrition'
  | 'water'
  | 'finance'
  | 'history'

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Home', icon: <IconHome /> },
  { id: 'tasks', label: 'Tasks', icon: <IconCheck /> },
  { id: 'counter', label: 'Counter', icon: <IconFlame /> },
  { id: 'workout', label: 'Workout', icon: <IconDumbbell /> },
  { id: 'nutrition', label: 'Nutrisi', icon: <IconApple /> },
  { id: 'water', label: 'Minum', icon: <IconDroplet /> },
  { id: 'finance', label: 'Finance', icon: <IconWallet /> },
  { id: 'history', label: 'Riwayat', icon: <IconClock /> },
]

export default function App() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Not signed in — this route is private, so bounce to the login page.
  useEffect(() => {
    if (session === null) router.replace('/masuk')
  }, [session, router])

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
        Memuat…
      </div>
    )
  }

  return (
    <StoreProvider session={session}>
      <Shell />
    </StoreProvider>
  )
}

function Shell() {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('dashboard')
  const { theme, toggleTheme, date, today, setDate, email, sync, signOut } = useStore()

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-neutral-200 p-4 lg:block dark:border-neutral-800">
        <div className="mb-6 px-2">
          <Link href="/" className="group flex items-center gap-1.5 text-sm font-semibold tracking-tight">
            <span className="text-neutral-400 transition group-hover:-translate-x-0.5 group-hover:text-indigo-500">
              <IconArrowLeft />
            </span>
            Daily Tracker
          </Link>
          <div className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400" title={email}>
            {email}
          </div>
        </div>
        <nav className="space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        <SyncBadge sync={sync} className="mt-6" />
        <Link href="/impor" className="btn-ghost mt-3 w-full">
          Impor data lama
        </Link>
        <button className="btn-ghost mt-2 w-full" onClick={toggleTheme}>
          {theme === 'dark' ? '☀︎ Light mode' : '☾ Dark mode'}
        </button>
        <button
          className="btn-ghost mt-2 w-full"
          onClick={() => {
            signOut()
            router.push('/')
          }}
        >
          Keluar
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50/85 px-4 py-3 backdrop-blur lg:hidden dark:border-neutral-800 dark:bg-neutral-950/85">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/"
              className="btn-icon shrink-0"
              aria-label="Kembali ke beranda"
              title="Kembali ke beranda"
            >
              <IconArrowLeft />
            </Link>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">Daily Tracker</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">{relativeLabel(date)}</div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {date !== today && (
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setDate(today)}>
                Hari ini
              </button>
            )}
            <button className="btn-ghost px-3 py-1.5" onClick={toggleTheme} aria-label="Ganti tema">
              {theme === 'dark' ? '☀︎' : '☾'}
            </button>
          </div>
        </header>

        {sync.status === 'error' && (
          <div className="px-4 pt-3 lg:hidden">
            <SyncBadge sync={sync} />
          </div>
        )}

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-28 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
              {tab === 'tasks' && <TaskChecklist />}
              {tab === 'counter' && <DayCounter />}
              {tab === 'workout' && <WorkoutTracker />}
              {tab === 'nutrition' && <NutritionTracker />}
              {tab === 'water' && <WaterTracker />}
              {tab === 'finance' && <Finance />}
              {tab === 'history' && <History onNavigate={setTab} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 grid grid-cols-8 border-t border-neutral-200 bg-white/95 backdrop-blur lg:hidden dark:border-neutral-800 dark:bg-neutral-900/95">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex min-w-0 flex-col items-center gap-1 px-0.5 py-2.5 text-[10px] font-medium transition ${
              tab === t.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {t.icon}
            <span className="w-full truncate text-center">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

/**
 * Save state, always visible. A tracker whose writes fail silently is worse
 * than one that refuses the edit, so a failure has to be impossible to miss.
 */
function SyncBadge({ sync, className = '' }: { sync: SyncState; className?: string }) {
  if (sync.status === 'idle') return null

  if (sync.status === 'error') {
    return (
      <div
        className={`rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300 ${className}`}
        role="alert"
      >
        <div className="font-medium">Gagal menyimpan</div>
        <p className="mt-0.5 leading-snug opacity-80">
          {sync.message ?? 'Perubahan terakhir belum tersimpan. Cek koneksi lalu muat ulang halaman.'}
        </p>
      </div>
    )
  }

  return (
    <div className={`px-1 text-xs text-neutral-400 dark:text-neutral-500 ${className}`}>
      {sync.status === 'saving' ? 'Menyimpan…' : '✓ Tersimpan'}
    </div>
  )
}

function IconArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M5 12l6-6M5 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconHome() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10l8-6 8 6v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z" strokeLinejoin="round" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h10M4 12h10M4 18h7" strokeLinecap="round" />
      <path d="M16.5 16.5l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconFlame() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 3s5 4 5 9a5 5 0 01-10 0c0-2 1-3 1-3s.5 2 2 2c0-4 2-8 2-8z"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconDumbbell() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" strokeLinecap="round" />
    </svg>
  )
}
function IconApple() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 8c-3-2-8 0-8 5s4 8 5.5 8S11 20 12 20s1.5 1 2.5 1S20 18 20 13s-5-7-8-5z" strokeLinejoin="round" />
      <path d="M12 8V5m0 0c0-1 1-2 2.5-2" strokeLinecap="round" />
    </svg>
  )
}
function IconDroplet() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.5s5.5 5.6 5.5 9.4a5.5 5.5 0 01-11 0C6.5 9.1 12 3.5 12 3.5z" strokeLinejoin="round" />
    </svg>
  )
}
function IconWallet() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" strokeLinecap="round" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
