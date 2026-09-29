'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { normalizeAppData, replaceAllData, summarize } from '../lib/sync'
import type { AppData } from '../lib/types'

/** Key the pre-Supabase build wrote to. Still readable on the same origin. */
const LEGACY_KEY = 'daily-tracker:data:v1'

type Stage =
  | { name: 'pick' }
  | { name: 'preview'; data: AppData; filename: string }
  | { name: 'working' }
  | { name: 'done' }
  | { name: 'error'; message: string }

export default function ImportLegacy() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [stage, setStage] = useState<Stage>({ name: 'pick' })
  /** Legacy data sitting in this browser, if the old app used this same origin. */
  const [inBrowser, setInBrowser] = useState<AppData | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    try {
      setInBrowser(normalizeAppData(JSON.parse(raw)))
    } catch {
      // Corrupt or unrelated value — the file upload path still works.
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === null) router.replace('/masuk')
  }, [session, router])

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      setStage({ name: 'preview', data: normalizeAppData(parsed), filename: file.name })
    } catch (err) {
      setStage({
        name: 'error',
        message: err instanceof Error ? err.message : 'File tidak bisa dibaca.',
      })
    }
  }

  const confirm = async (data: AppData) => {
    if (!session) return
    setStage({ name: 'working' })
    const result = await replaceAllData(session.user.id, data)
    setStage(
      result.ok
        ? { name: 'done' }
        : { name: 'error', message: result.error ?? 'Gagal menyimpan ke database.' },
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
        Memuat…
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 py-12">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        ← Kembali ke dashboard
      </Link>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Impor data lama</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Untuk memindahkan data dari versi lama aplikasi (yang tersimpan di browser) ke akunmu.
        Unggah file <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">.json</code>{' '}
        hasil ekspor dari halaman pemulihan.
      </p>

      {stage.name === 'pick' && inBrowser && (
        <div className="card mt-6 border-indigo-500/40">
          <div className="text-sm font-semibold">Data lama ditemukan di browser ini</div>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Tersimpan di <code className="text-xs">{window.location.origin}</code>. Tidak perlu unduh
            file — langsung bisa dipindahkan.
          </p>
          <ul className="mt-3 space-y-1.5">
            {summarize(inBrowser).map((row) => (
              <li key={row.label} className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">{row.label}</span>
                <span className="font-medium tabular-nums">{row.n}</span>
              </li>
            ))}
          </ul>
          <button
            className="btn-primary mt-4 w-full"
            onClick={() => setStage({ name: 'preview', data: inBrowser, filename: 'browser ini' })}
          >
            Pindahkan data ini
          </button>
        </div>
      )}

      {stage.name === 'pick' && (
        <div className="card mt-6">
          <label className="label" htmlFor="file">
            {inBrowser ? 'Atau unggah file dari perangkat lain' : 'Pilih file data lama'}
          </label>
          <input
            id="file"
            type="file"
            accept="application/json,.json"
            onChange={onFile}
            className="field cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm dark:file:bg-neutral-800 dark:file:text-neutral-200"
          />
        </div>
      )}

      {stage.name === 'preview' && (
        <div className="card mt-6">
          <div className="text-sm font-medium">Ditemukan di {stage.filename}</div>
          <ul className="mt-3 space-y-1.5">
            {summarize(stage.data).map((row) => (
              <li key={row.label} className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">{row.label}</span>
                <span className="font-medium tabular-nums">{row.n}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            Data yang sekarang ada di akun ini akan <strong>diganti</strong> dengan isi file tersebut.
            Kalau kamu sudah sempat mencatat sesuatu di versi baru, catatan itu akan hilang.
          </div>

          <div className="mt-4 flex gap-2">
            <button className="btn-primary flex-1" onClick={() => confirm(stage.data)}>
              Impor sekarang
            </button>
            <button className="btn-ghost" onClick={() => setStage({ name: 'pick' })}>
              Batal
            </button>
          </div>
        </div>
      )}

      {stage.name === 'working' && (
        <div className="card mt-6 text-sm text-neutral-500 dark:text-neutral-400">
          Memindahkan data ke database…
        </div>
      )}

      {stage.name === 'done' && (
        <div className="card mt-6">
          <div className="font-medium">Data berhasil dipindahkan</div>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Semuanya sudah tersimpan di akunmu dan bisa diakses dari perangkat mana pun.
          </p>
          <Link href="/dashboard" className="btn-primary mt-4 w-full">
            Buka dashboard
          </Link>
        </div>
      )}

      {stage.name === 'error' && (
        <div className="card mt-6">
          <div className="font-medium text-rose-600 dark:text-rose-400">Gagal</div>
          <p className="mt-1 break-words text-sm text-neutral-600 dark:text-neutral-400">
            {stage.message}
          </p>
          <button className="btn-ghost mt-4 w-full" onClick={() => setStage({ name: 'pick' })}>
            Coba file lain
          </button>
        </div>
      )}
    </div>
  )
}
