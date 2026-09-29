'use client'

import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { uid } from '../lib/seed'
import { reminderTimes, waterProgress, waterTarget } from '../lib/derive'
import type { ActivityLevel } from '../lib/types'
import { EmptyState, ProgressBar, SectionTitle, Stat, TrashIcon } from './ui'
import { formatLong, relativeLabel } from '../lib/date'

const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  ringan: 'Ringan — jarang olahraga',
  sedang: 'Sedang — olahraga 3-4× seminggu',
  berat: 'Berat — olahraga hampir tiap hari',
}

const formatMl = (ml: number) => (ml >= 1000 ? `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)} L` : `${ml} ml`)

const nowHHMM = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function WaterTracker() {
  const { data, date, today, dayLog, updateDay } = useStore()
  const [showSettings, setShowSettings] = useState(false)
  const w = data.water
  const target = waterTarget(w)
  const progress = waterProgress(dayLog, w)
  const isToday = date === today

  if (!data.waterReady) return <WaterMigrationNotice />

  const addWater = (ml: number) =>
    updateDay(date, (day) => {
      day.water = [...(day.water ?? []), { id: uid(), ml, at: nowHHMM() }]
    })

  const removeEntry = (id: string) =>
    updateDay(date, (day) => {
      day.water = (day.water ?? []).filter((e) => e.id !== id)
    })

  return (
    <div className="space-y-4">
      <WaterReminders />

      <div className="card">
        <SectionTitle
          title="Minum Air"
          subtitle={`${relativeLabel(date)} · ${formatLong(date)}`}
          action={
            <button className="btn-ghost" onClick={() => setShowSettings((v) => !v)}>
              {showSettings ? 'Tutup' : 'Atur target'}
            </button>
          }
        />

        <div className="flex items-end justify-between gap-4">
          <div className="text-3xl font-semibold tabular-nums">
            {formatMl(progress.drunkMl)}
            <span className="text-lg text-neutral-400"> / {formatMl(progress.targetMl)}</span>
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {Math.round(progress.percent)}%
          </div>
        </div>
        <ProgressBar percent={progress.percent} className="mt-3" />

        <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
          {target.recommended ? 'Saran otomatis' : 'Target manual'} · {target.reason}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Sudah minum" value={`${progress.glassesDone} gelas`} hint={`@ ${w.glassMl} ml`} />
          <Stat label="Target" value={`${progress.glassesTarget} gelas`} hint="sehari" />
          <Stat
            label="Sisa"
            value={formatMl(progress.remainingMl)}
            hint={progress.remainingMl === 0 ? 'target tercapai' : 'lagi hari ini'}
          />
        </div>
      </div>

      {showSettings && <WaterSettingsForm onDone={() => setShowSettings(false)} />}

      {/* Glass grid — one tap per glass, mirroring how people actually drink. */}
      <div className="card">
        <SectionTitle
          title="Catat minum"
          subtitle={`Dibagi ${progress.glassesTarget} gelas @ ${w.glassMl} ml`}
        />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: progress.glassesTarget }).map((_, i) => {
            const filled = i < progress.glassesDone
            return (
              <button
                key={i}
                onClick={() => addWater(w.glassMl)}
                aria-label={`Gelas ke-${i + 1}`}
                className={`flex h-12 w-10 items-end justify-center rounded-lg border-2 pb-1 text-lg transition active:scale-95 ${
                  filled
                    ? 'border-sky-500 bg-sky-500/20 text-sky-600 dark:text-sky-300'
                    : 'border-neutral-200 text-neutral-300 hover:border-sky-400 dark:border-neutral-700 dark:text-neutral-600'
                }`}
              >
                {filled ? '💧' : ''}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[100, 250, 500, 750].map((ml) => (
            <button key={ml} className="btn-ghost text-xs" onClick={() => addWater(ml)}>
              + {formatMl(ml)}
            </button>
          ))}
        </div>

        {!isToday && (
          <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
            Kamu sedang melihat {relativeLabel(date).toLowerCase()} — catatan masuk ke tanggal itu,
            tapi jamnya memakai jam sekarang.
          </p>
        )}
      </div>

      <div className="card">
        <SectionTitle title="Riwayat hari ini" />
        {(dayLog.water ?? []).length === 0 ? (
          <EmptyState>Belum ada catatan minum untuk tanggal ini.</EmptyState>
        ) : (
          <div className="space-y-1">
            {[...(dayLog.water ?? [])]
              .sort((a, b) => a.at.localeCompare(b.at))
              .map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <span className="text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
                    {e.at}
                  </span>
                  <span className="flex-1 px-3 text-sm">{formatMl(e.ml)}</span>
                  <button className="btn-icon" onClick={() => removeEntry(e.id)} title="Hapus">
                    <TrashIcon />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Shown when migration 0002 hasn't been applied to the database yet. */
function WaterMigrationNotice() {
  return (
    <div className="card">
      <SectionTitle title="Minum Air" subtitle="Fitur belum aktif" />
      <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Tabel penyimpanan untuk tracker minum belum dibuat di database. Tracker lain tetap jalan
        normal — hanya tab ini yang menunggu.
      </p>
      <div className="mt-4 rounded-xl bg-neutral-100 px-3 py-3 text-sm dark:bg-neutral-800">
        <p className="font-medium">Cara mengaktifkan</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-neutral-600 dark:text-neutral-400">
          <li>Buka Supabase Dashboard → SQL Editor → New query.</li>
          <li>
            Paste isi file <code className="text-xs">supabase/migrations/0002_water.sql</code>.
          </li>
          <li>Klik Run, lalu muat ulang halaman ini.</li>
        </ol>
      </div>
      <button className="btn-ghost mt-4 w-full" onClick={() => window.location.reload()}>
        Sudah dijalankan — muat ulang
      </button>
    </div>
  )
}

function WaterSettingsForm({ onDone }: { onDone: () => void }) {
  const { data, update } = useStore()
  const w = data.water
  const [form, setForm] = useState({
    weightKg: w.weightKg ? String(w.weightKg) : '',
    activity: w.activity,
    manual: w.targetMl != null,
    targetMl: String(w.targetMl ?? ''),
    glassMl: String(w.glassMl),
    remindersEnabled: w.remindersEnabled,
    intervalMin: String(w.intervalMin),
    wakeTime: w.wakeTime,
    sleepTime: w.sleepTime,
  })

  // Live preview of the recommendation as the weight/activity inputs change.
  const preview = waterTarget({
    ...w,
    weightKg: Number(form.weightKg) || undefined,
    activity: form.activity,
    targetMl: undefined,
  })

  const save = () => {
    update((d) => {
      d.water = {
        weightKg: Number(form.weightKg) || undefined,
        activity: form.activity,
        targetMl: form.manual ? Number(form.targetMl) || undefined : undefined,
        glassMl: Math.max(50, Number(form.glassMl) || 250),
        remindersEnabled: form.remindersEnabled,
        intervalMin: Math.max(15, Number(form.intervalMin) || 90),
        wakeTime: form.wakeTime,
        sleepTime: form.sleepTime,
      }
    })
    onDone()
  }

  const slots = reminderTimes({
    ...w,
    intervalMin: Math.max(15, Number(form.intervalMin) || 90),
    wakeTime: form.wakeTime,
    sleepTime: form.sleepTime,
  })

  return (
    <div className="card space-y-4">
      <SectionTitle title="Atur target minum" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Berat badan (kg)</label>
          <input
            type="number"
            min={20}
            max={250}
            className="field"
            placeholder="misal 60"
            value={form.weightKg}
            onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Tingkat aktivitas</label>
          <select
            className="field"
            value={form.activity}
            onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value as ActivityLevel }))}
          >
            {(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((a) => (
              <option key={a} value={a}>
                {ACTIVITY_LABEL[a]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl bg-sky-500/10 px-3 py-2.5 text-sm text-sky-800 dark:text-sky-300">
        Saran untuk kamu: <strong>{formatMl(preview.ml)} per hari</strong>
        <div className="mt-0.5 text-xs opacity-80">{preview.reason}</div>
      </div>

      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={form.manual}
          onChange={(e) => setForm((f) => ({ ...f, manual: e.target.checked }))}
        />
        <span>
          Pakai target sendiri
          <span className="block text-xs text-neutral-500 dark:text-neutral-400">
            Abaikan saran di atas dan tentukan angkamu sendiri.
          </span>
        </span>
      </label>

      {form.manual && (
        <div>
          <label className="label">Target harian (ml)</label>
          <input
            type="number"
            min={500}
            step={50}
            className="field"
            placeholder="misal 2500"
            value={form.targetMl}
            onChange={(e) => setForm((f) => ({ ...f, targetMl: e.target.value }))}
          />
        </div>
      )}

      <div>
        <label className="label">Ukuran satu gelas (ml)</label>
        <input
          type="number"
          min={50}
          step={50}
          className="field"
          value={form.glassMl}
          onChange={(e) => setForm((f) => ({ ...f, glassMl: e.target.value }))}
        />
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Botol tumbler biasanya 500-1000 ml, gelas biasa 200-250 ml.
        </p>
      </div>

      <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.remindersEnabled}
            onChange={(e) => setForm((f) => ({ ...f, remindersEnabled: e.target.checked }))}
          />
          <span>
            Nyalakan pengingat
            <span className="block text-xs text-neutral-500 dark:text-neutral-400">
              Notifikasi browser selama tab aplikasi ini terbuka.
            </span>
          </span>
        </label>

        {form.remindersEnabled && (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Mulai jam</label>
                <input
                  type="time"
                  className="field"
                  value={form.wakeTime}
                  onChange={(e) => setForm((f) => ({ ...f, wakeTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Sampai jam</label>
                <input
                  type="time"
                  className="field"
                  value={form.sleepTime}
                  onChange={(e) => setForm((f) => ({ ...f, sleepTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Tiap (menit)</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  className="field"
                  value={form.intervalMin}
                  onChange={(e) => setForm((f) => ({ ...f, intervalMin: e.target.value }))}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              {slots.length} pengingat: {slots.slice(0, 6).join(', ')}
              {slots.length > 6 ? `, … ${slots[slots.length - 1]}` : ''}
            </p>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button className="btn-primary" onClick={save}>
          Simpan
        </button>
        <button className="btn-ghost" onClick={onDone}>
          Batal
        </button>
      </div>
    </div>
  )
}

/**
 * Fires a browser notification at each reminder slot while the tab is open.
 * Real background push would need a service worker and a server — deliberately
 * out of scope, so the UI says plainly that the tab has to stay open.
 */
function WaterReminders() {
  const { data, today, dayLog } = useStore()
  const w = data.water
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  /** Slots already fired today, so a reminder never repeats within its minute. */
  const fired = useRef<Set<string>>(new Set())

  useEffect(() => {
    setPermission(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
  }, [])

  const progress = waterProgress(dayLog, w)
  const done = progress.remainingMl === 0

  useEffect(() => {
    if (!w.remindersEnabled || permission !== 'granted' || done) return
    const slots = new Set(reminderTimes(w))

    const tick = () => {
      const now = nowHHMM()
      if (!slots.has(now) || fired.current.has(`${today}:${now}`)) return
      fired.current.add(`${today}:${now}`)
      new Notification('Waktunya minum air 💧', {
        body: `Sisa ${formatMl(progress.remainingMl)} lagi untuk mencapai target hari ini.`,
        tag: 'daily-tracker-water',
      })
    }

    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [w, permission, done, today, progress.remainingMl])

  if (!w.remindersEnabled || permission === 'unsupported' || permission === 'granted') return null

  return (
    <div className="card border-sky-500/40">
      <div className="text-sm font-medium">Izinkan notifikasi untuk pengingat</div>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {permission === 'denied'
          ? 'Notifikasi diblokir untuk situs ini. Aktifkan lewat ikon gembok di address bar browser.'
          : 'Pengingat minum butuh izin notifikasi. Berlaku selama tab ini terbuka.'}
      </p>
      {permission === 'default' && (
        <button
          className="btn-primary mt-3"
          onClick={() => Notification.requestPermission().then(setPermission)}
        >
          Izinkan notifikasi
        </button>
      )}
    </div>
  )
}
