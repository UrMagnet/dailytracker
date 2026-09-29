import { useStore } from '../lib/store'
import {
  cashBalance,
  counterStreak,
  counterValue,
  formatIdr,
  latestPortfolioValue,
  round1,
  sumMacros,
  taskProgress,
  totalDebtRemaining,
  totalInvestmentCostBasis,
  waterProgress,
  weekWorkoutStats,
} from '../lib/derive'
import { nutritionTargets } from '../lib/akg'
import { CountUp, EmptyState, ProgressBar, ProgressRing, SectionTitle, Stat } from './ui'
import { formatLong, fromISODate, mondayIndex, relativeLabel, weekKey } from '../lib/date'
import type { TabId } from '../App'

export default function Dashboard({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { data, date, today, dayLog } = useStore()

  const tasks = taskProgress(data.tasks, dayLog)
  const workout = weekWorkoutStats(data, date)
  const water = waterProgress(dayLog, data.water)
  const nutrition = sumMacros(dayLog.meals, data.foods)
  const nutriTarget = nutritionTargets(data.nutrition)
  const dayIndex = mondayIndex(fromISODate(date))
  const todayWorkout = {
    cfg: data.workoutSchedule.find((c) => c.day === dayIndex),
    log: (data.weeks[weekKey(date)] ?? {})[dayIndex],
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{relativeLabel(date)}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{formatLong(date)}</h1>
        {date !== today && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Kamu sedang melihat tanggal lain — semua perubahan tersimpan ke tanggal ini.
          </p>
        )}
      </div>

      <button onClick={() => onNavigate('tasks')} className="card block w-full text-left transition hover:border-indigo-500/40">
        <SectionTitle title="Daily Tasks" subtitle={`${tasks.done} dari ${tasks.total} task selesai`} />
        <div className="flex items-center gap-4">
          <div className="text-3xl font-semibold tabular-nums">
            {Math.round(tasks.percent)}
            <span className="text-lg text-neutral-400">%</span>
          </div>
          <ProgressBar percent={tasks.percent} />
        </div>
      </button>

      <div className="card">
        <SectionTitle title="Counting Day" subtitle="Progress counter kamu" />
        {data.counters.length === 0 ? (
          <EmptyState>Belum ada counter.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.counters.map((c) => (
              <button
                key={c.id}
                onClick={() => onNavigate('counter')}
                className="rounded-xl border border-neutral-200 px-3 py-3 text-left transition hover:border-indigo-500/40 dark:border-neutral-800"
              >
                <div className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                  Day {counterValue(c, date)}
                </div>
                <div className="mt-0.5 truncate text-sm font-medium">{c.title}</div>
                <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Streak {counterStreak(c, today)} hari ·{' '}
                  {c.checkedDates.includes(date) ? 'sudah check-in' : 'belum check-in'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => onNavigate('workout')}
        className="card block w-full text-left transition hover:border-indigo-500/40"
      >
        <SectionTitle
          title="Workout"
          subtitle={
            todayWorkout.cfg
              ? `${todayWorkout.cfg.name}: ${todayWorkout.log?.focusOverride || todayWorkout.cfg.focus}`
              : undefined
          }
        />
        <div className="flex items-center gap-4">
          <div className="text-3xl font-semibold tabular-nums">
            {workout.done}
            <span className="text-lg text-neutral-400">/{workout.total}</span>
          </div>
          <ProgressBar percent={workout.percent} />
        </div>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {todayWorkout.log?.done ? '✓ Latihan hari ini sudah dicentang' : 'Latihan hari ini belum dicentang'}
        </p>
      </button>

      <button
        onClick={() => onNavigate('nutrition')}
        className="card block w-full text-left transition hover:border-indigo-500/40"
      >
        <SectionTitle title="Nutrition" subtitle={`${dayLog.meals.length} entry makanan hari ini`} />
        <div className="flex flex-wrap items-center gap-5">
          <ProgressRing percent={Math.min(100, (nutrition.kcal / nutriTarget.kcal) * 100)} size={88}>
            <div className="text-lg font-semibold tabular-nums">{Math.round(nutrition.kcal)}</div>
            <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
              dari {nutriTarget.kcal}
            </div>
          </ProgressRing>
          <div className="grid flex-1 grid-cols-3 gap-2">
            <Stat label="Protein" value={`${round1(nutrition.protein)} g`} />
            <Stat label="Karbo" value={`${round1(nutrition.carbs)} g`} />
            <Stat
              label="Gula"
              value={`${round1(nutrition.sugar)} g`}
              hint={nutrition.sugar > nutriTarget.sugar ? `lewat batas ${nutriTarget.sugar} g` : `batas ${nutriTarget.sugar} g`}
            />
          </div>
        </div>
      </button>

      {data.waterReady && <button
        onClick={() => onNavigate('water')}
        className="card block w-full text-left transition hover:border-sky-500/40"
      >
        <SectionTitle
          title="Minum Air"
          subtitle={`${water.glassesDone} dari ${water.glassesTarget} gelas hari ini`}
        />
        <div className="flex items-end justify-between gap-4">
          <div className="text-2xl font-semibold tabular-nums">
            {(water.drunkMl / 1000).toFixed(1)}
            <span className="text-base text-neutral-400"> / {(water.targetMl / 1000).toFixed(1)} L</span>
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {water.remainingMl === 0 ? 'Target tercapai 🎉' : `Sisa ${water.remainingMl} ml`}
          </div>
        </div>
        <ProgressBar percent={water.percent} className="mt-3" />
      </button>}

      <button onClick={() => onNavigate('finance')} className="card-accent block w-full text-left">
        <SectionTitle title="Finance" />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-xs text-white/70">Saldo</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">
              <CountUp value={cashBalance(data)} format={formatIdr} />
            </div>
          </div>
          <div>
            <div className="text-xs text-white/70">Total hutang</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">{formatIdr(totalDebtRemaining(data))}</div>
          </div>
          <div>
            <div className="text-xs text-white/70">Investasi (P/L)</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">
              {(() => {
                const value = latestPortfolioValue(data)
                if (value === null) return '—'
                const pl = value - totalInvestmentCostBasis(data)
                return `${pl >= 0 ? '+' : ''}${formatIdr(pl)}`
              })()}
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}
