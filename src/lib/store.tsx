import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AppData, DayLog } from './types'
import { supabase } from './supabase'
import { loadAppData, persistDiff } from './sync'
import { toISODate } from './date'

const THEME_KEY = 'daily-tracker:theme'

export const emptyDay = (): DayLog => ({ tasks: {}, meals: [], water: [] })

export interface SyncState {
  status: 'idle' | 'saving' | 'saved' | 'error'
  message?: string
}

interface StoreValue {
  data: AppData
  update: (fn: (draft: AppData) => void) => void
  /** Currently viewed date (defaults to today, changeable from Riwayat). */
  date: string
  setDate: (iso: string) => void
  today: string
  dayLog: DayLog
  updateDay: (iso: string, fn: (day: DayLog) => void) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
  /** Email of the signed-in user, shown in the dashboard sidebar. */
  email: string
  /** Whether the last change reached the database — surfaced in the UI. */
  sync: SyncState
  signOut: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ session, children }: { session: Session; children: ReactNode }) {
  const userId = session.user.id
  const email = session.user.email ?? ''
  const [data, setData] = useState<AppData | null>(null)
  const [sync, setSync] = useState<SyncState>({ status: 'idle' })
  /** Last snapshot successfully handed to the sync layer — the diff baseline. */
  const persisted = useRef<AppData | null>(null)
  /** Serialises writes so two rapid edits can't race each other. */
  const queue = useRef<Promise<void>>(Promise.resolve())
  const [today, setToday] = useState(() => toISODate())
  const [date, setDate] = useState(today)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(THEME_KEY)
    return saved === 'light' ? 'light' : 'dark'
  })

  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadError(null)
    loadAppData(userId)
      .then((loaded) => {
        if (cancelled) return
        persisted.current = loaded
        setData(loaded)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Gagal memuat data')
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  // Persist every change. This has to be an effect, not part of the state
  // updater: React may run an updater more than once, and firing network
  // writes from inside one drops or duplicates them.
  useEffect(() => {
    const prev = persisted.current
    if (!data || !prev || prev === data) return
    persisted.current = data
    setSync({ status: 'saving' })
    queue.current = queue.current.then(async () => {
      const result = await persistDiff(userId, prev, data)
      setSync(result.ok ? { status: 'saved' } : { status: 'error', message: result.error })
    })
  }, [data, userId])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // Roll over to the new day if the tab stays open past midnight.
  useEffect(() => {
    const tick = () => {
      const now = toISODate()
      setToday((prev) => {
        if (prev !== now) setDate((d) => (d === prev ? now : d))
        return now
      })
    }
    const id = window.setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  // Pure: it only computes the next state. Saving happens in the effect above.
  const update = useCallback((fn: (draft: AppData) => void) => {
    setData((prev) => {
      if (!prev) return prev
      const draft = structuredClone(prev) as AppData
      fn(draft)
      return draft
    })
  }, [])

  const updateDay = useCallback(
    (iso: string, fn: (day: DayLog) => void) => {
      update((draft) => {
        const day = draft.days[iso] ?? emptyDay()
        fn(day)
        draft.days[iso] = day
      })
    },
    [update],
  )

  const dayLog = data?.days[date] ?? emptyDay()

  const value = useMemo<StoreValue | null>(
    () =>
      data && {
        data,
        update,
        date,
        setDate,
        today,
        dayLog,
        updateDay,
        theme,
        toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
        email,
        sync,
        signOut: () => void supabase.auth.signOut(),
      },
    [data, update, date, today, dayLog, updateDay, theme, email, sync],
  )

  if (loadError) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="card w-full max-w-sm text-center">
          <h1 className="text-base font-semibold">Data tidak bisa dimuat</h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{loadError}</p>
          <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
            Datamu tidak hilang — aplikasi sengaja berhenti di sini supaya tidak menimpanya.
          </p>
          <button className="btn-primary mt-4 w-full" onClick={() => window.location.reload()}>
            Coba lagi
          </button>
        </div>
      </div>
    )
  }

  if (!value) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
        Memuat data…
      </div>
    )
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
