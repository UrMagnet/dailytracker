import { useState } from 'react'
import { useStore, emptyDay } from '../lib/store'
import { addDays, formatLong, formatShort, mondayIndex, fromISODate, toISODate, weekKey } from '../lib/date'
import { sumMacros, taskProgress } from '../lib/derive'
import { ProgressBar, SectionTitle } from './ui'
import type { TabId } from '../App'

const RANGES = [7, 14, 30]

export default function History({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { data, date, setDate, today } = useStore()
  const [range, setRange] = useState(14)

  const days = Array.from({ length: range }, (_, i) => addDays(today, -i))

  return (
    <div className="space-y-4">
      <div className="card">
        <SectionTitle
          title="Riwayat"
          subtitle="Lihat konsistensi beberapa hari ke belakang"
          action={
            <div className="flex gap-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`chip ${
                    range === r
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {r}h
                </button>
              ))}
            </div>
          }
        />
        <div>
          <label className="label">Pilih tanggal yang sedang dilihat</label>
          <div className="flex gap-2">
            <input
              type="date"
              className="field"
              value={date}
              max={toISODate()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
            <button className="btn-ghost whitespace-nowrap" onClick={() => setDate(today)}>
              Hari ini
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="space-y-1">
          {days.map((iso) => {
            const day = data.days[iso] ?? emptyDay()
            const tasks = taskProgress(data.tasks, day)
            const kcal = sumMacros(day.meals, data.foods).kcal
            const workoutDone = (data.weeks[weekKey(iso)] ?? {})[mondayIndex(fromISODate(iso))]?.done
            const counters = data.counters.filter((c) => c.checkedDates.includes(iso)).length
            const active = iso === date

            return (
              <button
                key={iso}
                onClick={() => {
                  setDate(iso)
                  onNavigate('dashboard')
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  active
                    ? 'bg-indigo-600/10 ring-1 ring-indigo-600/30 dark:bg-indigo-500/10'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="w-16 shrink-0">
                  <div className="text-sm font-medium">{formatShort(iso)}</div>
                  <div className="text-[11px] text-neutral-400">{formatLong(iso).split(',')[0]}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <ProgressBar percent={tasks.percent} />
                  <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
                    <span>
                      {tasks.done}/{tasks.total} task
                    </span>
                    <span>{Math.round(kcal)} kkal</span>
                    <span>{workoutDone ? '✓ workout' : '– workout'}</span>
                    <span>{counters} counter</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
