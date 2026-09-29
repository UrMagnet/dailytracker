'use client'

import { useState } from 'react'
import { useStore } from '../lib/store'
import { addDays, formatShort, fromISODate, mondayIndex, weekKey, weekStart } from '../lib/date'
import { isRestDay, weekWorkoutStats } from '../lib/derive'
import { Checkbox, PencilIcon, ProgressBar, SectionTitle } from './ui'
import type { WorkoutDayLog } from '../lib/types'

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

/**
 * Starting points, not rules — every field stays editable afterwards. Order is
 * Senin … Minggu.
 */
const TEMPLATES: { name: string; hint: string; focus: string[] }[] = [
  {
    name: 'Push / Pull / Legs',
    hint: '6 hari latihan',
    focus: ['Push (dada, bahu, triceps)', 'Pull (punggung, biceps)', 'Leg Day', 'Push', 'Pull', 'Leg Day', 'Rest'],
  },
  {
    name: 'Upper / Lower',
    hint: '4 hari latihan',
    focus: ['Upper Body', 'Lower Body', 'Rest', 'Upper Body', 'Lower Body', 'Cardio', 'Rest'],
  },
  {
    name: 'Full Body 3×',
    hint: 'cocok untuk pemula',
    focus: ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Cardio ringan', 'Rest'],
  },
  {
    name: 'Bro Split',
    hint: 'satu otot per hari',
    focus: ['Dada', 'Punggung', 'Bahu', 'Lengan', 'Kaki', 'Cardio', 'Rest'],
  },
]

export default function WorkoutTracker() {
  const { data, update, date, setDate, today } = useStore()
  const [editing, setEditing] = useState(false)

  const start = weekStart(date)
  const key = weekKey(date)
  const week = data.weeks[key] ?? {}
  const stats = weekWorkoutStats(data, date)
  const todayIndex = mondayIndex(fromISODate(today))
  const isCurrentWeek = weekStart(today) === start

  const patch = (dayIndex: number, fn: (log: WorkoutDayLog) => void) =>
    update((d) => {
      const w = d.weeks[key] ?? {}
      const log = w[dayIndex] ?? { done: false }
      fn(log)
      w[dayIndex] = log
      d.weeks[key] = w
    })

  // Navigating weeks just moves the viewed date; every tab shares it.
  const shiftWeek = (delta: number) => setDate(addDays(date, delta * 7))

  return (
    <div className="space-y-4">
      <div className="card">
        <SectionTitle
          title="Workout Split"
          subtitle={`Minggu ${key} · ${formatShort(start)} – ${formatShort(addDays(start, 6))}`}
          action={
            <div className="flex gap-1">
              <button className="btn-ghost px-3" onClick={() => shiftWeek(-1)} title="Minggu sebelumnya">
                ‹
              </button>
              <button className="btn-ghost px-3" onClick={() => shiftWeek(1)} title="Minggu berikutnya">
                ›
              </button>
            </div>
          }
        />
        <div className="flex items-end justify-between gap-4">
          <div className="text-3xl font-semibold tabular-nums">
            {stats.done}
            <span className="text-lg text-neutral-400">/{stats.total}</span>
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {Math.round(stats.percent)}% minggu ini
          </div>
        </div>
        <ProgressBar percent={stats.percent} className="mt-3" />
        <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
          Hari istirahat tidak ikut dihitung.
        </p>

        <button className="btn-ghost mt-4 w-full" onClick={() => setEditing((v) => !v)}>
          <PencilIcon /> {editing ? 'Selesai mengatur' : 'Atur jadwal mingguan'}
        </button>
      </div>

      {editing && <ScheduleEditor onDone={() => setEditing(false)} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.workoutSchedule.map((cfg) => {
          const log = week[cfg.day] ?? { done: false }
          const focus = log.focusOverride || cfg.focus
          const dayIso = addDays(start, cfg.day)
          const isToday = isCurrentWeek && cfg.day === todayIndex
          const rest = isRestDay(focus)

          return (
            <div
              key={cfg.day}
              className={`card ${isToday ? 'ring-2 ring-indigo-500/50' : ''} ${
                log.done ? 'border-indigo-500/40 dark:border-indigo-500/30' : ''
              } ${rest ? 'opacity-75' : ''}`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold">{cfg.name}</h3>
                <span className="text-xs text-neutral-400">{formatShort(dayIso)}</span>
              </div>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {focus}
                {log.focusOverride && (
                  <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-400">
                    (khusus minggu ini)
                  </span>
                )}
              </p>

              {/* Free text, with the day's own presets offered as suggestions. */}
              <input
                className="field mt-3 text-sm"
                list={cfg.options?.length ? `opts-${cfg.day}` : undefined}
                placeholder="Ganti khusus minggu ini…"
                value={log.focusOverride ?? ''}
                onChange={(e) =>
                  patch(cfg.day, (l) => {
                    l.focusOverride = e.target.value || undefined
                  })
                }
              />
              {cfg.options?.length ? (
                <datalist id={`opts-${cfg.day}`}>
                  {cfg.options.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
              ) : null}

              {rest ? (
                <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
                  Hari istirahat — tidak perlu dicentang.
                </p>
              ) : (
                <div className="mt-3 -ml-2">
                  <Checkbox
                    checked={log.done}
                    onChange={(v) => patch(cfg.day, (l) => (l.done = v))}
                    label={log.done ? 'Selesai' : 'Belum latihan'}
                  />
                </div>
              )}

              <textarea
                className="field mt-2 min-h-[62px] resize-y"
                placeholder="Catatan (beban / rep / durasi)…"
                value={log.note ?? ''}
                onChange={(e) =>
                  patch(cfg.day, (l) => {
                    l.note = e.target.value || undefined
                  })
                }
              />
            </div>
          )
        })}
      </div>

      <p className="px-1 text-xs text-neutral-400 dark:text-neutral-500">
        Kolom &ldquo;ganti khusus minggu ini&rdquo; dan catatan hanya berlaku untuk minggu yang sedang
        dibuka — jadwal tetapnya tidak ikut berubah.
      </p>
    </div>
  )
}

/** Edits the recurring schedule: what each weekday means by default. */
function ScheduleEditor({ onDone }: { onDone: () => void }) {
  const { data, update } = useStore()

  const setFocus = (day: number, focus: string) =>
    update((d) => {
      const cfg = d.workoutSchedule.find((c) => c.day === day)
      if (cfg) cfg.focus = focus
    })

  const applyTemplate = (focus: string[]) =>
    update((d) => {
      // Rebuild all seven days so a template always lands on a complete week.
      d.workoutSchedule = focus.map((f, day) => ({
        day,
        name: DAY_NAMES[day],
        focus: f,
        options: d.workoutSchedule.find((c) => c.day === day)?.options,
      }))
    })

  return (
    <div className="card space-y-4">
      <SectionTitle
        title="Jadwal tetap mingguan"
        subtitle="Berlaku untuk semua minggu, sampai kamu ubah lagi"
      />

      <div className="space-y-2">
        {DAY_NAMES.map((name, day) => {
          const cfg = data.workoutSchedule.find((c) => c.day === day)
          const focus = cfg?.focus ?? ''
          return (
            <div key={day} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm font-medium">{name}</span>
              <input
                className="field text-sm"
                placeholder="Latihan apa hari ini? Tulis 'Rest' kalau libur"
                value={focus}
                onChange={(e) => setFocus(day, e.target.value)}
              />
              {isRestDay(focus) && (
                <span className="chip shrink-0 bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  Libur
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <p className="text-sm font-medium">Mulai dari template</p>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          Mengisi ketujuh hari sekaligus. Setelah dipilih tetap bisa kamu edit satu per satu.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              className="rounded-xl border border-neutral-200 px-3 py-2.5 text-left transition hover:border-indigo-500/50 dark:border-neutral-700"
              onClick={() => {
                if (!confirm(`Ganti seluruh jadwal dengan template "${t.name}"?`)) return
                applyTemplate(t.focus)
              }}
            >
              <div className="text-sm font-medium">{t.name}</div>
              <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{t.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <button className="btn-primary w-full" onClick={onDone}>
        Selesai
      </button>
    </div>
  )
}
