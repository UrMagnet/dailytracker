import { useState } from 'react'
import { useStore } from '../lib/store'
import { uid } from '../lib/seed'
import { counterMissedDays, counterStreak, counterValue, isCheckedOn } from '../lib/derive'
import type { Counter } from '../lib/types'
import { EmptyState, PencilIcon, PlusIcon, SectionTitle, Stat, TrashIcon } from './ui'
import { formatLong, relativeLabel, toISODate } from '../lib/date'

export default function DayCounter() {
  const { data, update, date } = useStore()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', startValue: '1' })

  const createCounter = () => {
    const title = form.title.trim()
    if (!title) return
    update((d) =>
      d.counters.push({
        id: uid(),
        title,
        startValue: Number(form.startValue) || 0,
        startDate: toISODate(),
        checkedDates: [],
      }),
    )
    setForm({ title: '', startValue: '1' })
    setCreating(false)
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <SectionTitle
          title="Counting Day"
          subtitle={`Check-in untuk ${relativeLabel(date).toLowerCase()} · ${formatLong(date)}`}
          action={
            <button className="btn-ghost" onClick={() => setCreating((v) => !v)}>
              <PlusIcon /> Counter
            </button>
          }
        />
        {creating && (
          <form
            className="grid gap-3 sm:grid-cols-[1fr_140px_auto]"
            onSubmit={(e) => {
              e.preventDefault()
              createCounter()
            }}
          >
            <div>
              <label className="label">Judul counter</label>
              <input
                autoFocus
                className="field"
                placeholder="Misal: No Sugar"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Mulai dari hari ke-</label>
              <input
                type="number"
                min={0}
                className="field"
                value={form.startValue}
                onChange={(e) => setForm((f) => ({ ...f, startValue: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">
                Buat
              </button>
            </div>
          </form>
        )}
        {!creating && data.counters.length === 0 && (
          <EmptyState>Belum ada counter. Buat satu untuk mulai menghitung hari.</EmptyState>
        )}
      </div>

      {data.counters.map((counter) => (
        <CounterCard key={counter.id} counter={counter} />
      ))}
    </div>
  )
}

function CounterCard({ counter }: { counter: Counter }) {
  const { update, date, today } = useStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: counter.title,
    startValue: String(counter.startValue),
    startDate: counter.startDate,
  })

  const value = counterValue(counter, date)
  const checked = isCheckedOn(counter, date)
  const streak = counterStreak(counter, today)
  const missed = counterMissedDays(counter, today)
  const isFuture = date > today

  const toggle = () =>
    update((d) => {
      const c = d.counters.find((c) => c.id === counter.id)
      if (!c) return
      if (c.checkedDates.includes(date)) {
        c.checkedDates = c.checkedDates.filter((x) => x !== date)
      } else {
        c.checkedDates = [...c.checkedDates, date].sort()
      }
    })

  const save = () => {
    update((d) => {
      const c = d.counters.find((c) => c.id === counter.id)
      if (!c) return
      c.title = form.title.trim() || c.title
      c.startValue = Number(form.startValue) || 0
      c.startDate = form.startDate
    })
    setEditing(false)
  }

  return (
    <div className="card">
      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <div>
            <label className="label">Judul</label>
            <input
              className="field"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Mulai dari hari ke-</label>
              <input
                type="number"
                min={0}
                className="field"
                value={form.startValue}
                onChange={(e) => setForm((f) => ({ ...f, startValue: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Tanggal mulai</label>
              <input
                type="date"
                className="field"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              Simpan
            </button>
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
              Batal
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                Day {value}
              </div>
              <h3 className="mt-1 text-xl font-semibold leading-tight">{counter.title}</h3>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Mulai {formatLong(counter.startDate)}
              </p>
            </div>
            <div className="flex shrink-0">
              <button className="btn-icon" onClick={() => setEditing(true)} title="Edit">
                <PencilIcon />
              </button>
              <button
                className="btn-icon"
                title="Hapus counter"
                onClick={() => {
                  if (!confirm(`Hapus counter "${counter.title}"?`)) return
                  update((d) => {
                    d.counters = d.counters.filter((c) => c.id !== counter.id)
                  })
                }}
              >
                <TrashIcon />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Hari ke-" value={value} />
            <Stat label="Streak" value={`${streak} hari`} hint="berturut-turut" />
            <Stat label="Bolong" value={`${missed} hari`} hint="sejak mulai" />
          </div>

          <button
            onClick={toggle}
            disabled={isFuture}
            className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-medium transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${
              checked
                ? 'bg-indigo-600/10 text-indigo-700 ring-1 ring-indigo-600/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {isFuture
              ? 'Belum bisa dicentang (tanggal di masa depan)'
              : checked
                ? `✓ ${relativeLabel(date)} sudah ditandai — ketuk untuk batal`
                : `Tandai ${relativeLabel(date).toLowerCase()} selesai`}
          </button>
          {checked && (
            <p className="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-400">
              Terkunci untuk tanggal ini — besok tombolnya aktif lagi.
            </p>
          )}
        </>
      )}
    </div>
  )
}
