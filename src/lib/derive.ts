import type {
  ActivityLevel,
  AppData,
  Counter,
  Debt,
  DayLog,
  Food,
  InstrumentId,
  MealEntry,
  Task,
  WaterSettings,
} from './types'
import { addDays, daysBetween, toISODate, weekKey } from './date'

/** Every checkable key of a task: the task itself, or one key per subtask. */
export function taskKeys(task: Task): string[] {
  if (task.subtasks.length > 0) return task.subtasks.map((s) => `${task.id}:${s.id}`)
  return [task.id]
}

export function taskProgress(tasks: Task[], day: DayLog) {
  const keys = tasks.flatMap(taskKeys)
  const done = keys.filter((k) => day.tasks[k]).length
  return { done, total: keys.length, percent: keys.length ? (done / keys.length) * 100 : 0 }
}

export function isTaskDone(task: Task, day: DayLog): boolean {
  const keys = taskKeys(task)
  return keys.length > 0 && keys.every((k) => day.tasks[k])
}

/** Value shown today: start value + one per check-in on/after the start date. */
export function counterValue(counter: Counter, upToIso: string = toISODate()): number {
  const counted = counter.checkedDates.filter((d) => d <= upToIso).length
  return counter.startValue + counted
}

export function isCheckedOn(counter: Counter, iso: string): boolean {
  return counter.checkedDates.includes(iso)
}

/** Consecutive days checked, counting back from today (or yesterday if today is still open). */
export function counterStreak(counter: Counter, todayIso: string = toISODate()): number {
  const set = new Set(counter.checkedDates)
  let cursor = set.has(todayIso) ? todayIso : addDays(todayIso, -1)
  let streak = 0
  while (set.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function counterMissedDays(counter: Counter, todayIso: string = toISODate()): number {
  const elapsed = Math.max(0, daysBetween(counter.startDate, todayIso))
  return Math.max(0, elapsed + 1 - counter.checkedDates.length)
}

export interface Macros {
  kcal: number
  protein: number
  carbs: number
  fat: number
  /** Total sugars, g. */
  sugar: number
  fiber: number
  /** Sodium, mg. */
  sodium: number
}

export const emptyMacros: Macros = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  sugar: 0,
  fiber: 0,
  sodium: 0,
}

export function macrosFor(food: Food | undefined, grams: number): Macros {
  if (!food) return { ...emptyMacros }
  const f = grams / 100
  return {
    kcal: food.kcal * f,
    protein: food.protein * f,
    carbs: food.carbs * f,
    fat: food.fat * f,
    sugar: (food.sugar ?? 0) * f,
    fiber: (food.fiber ?? 0) * f,
    sodium: (food.sodium ?? 0) * f,
  }
}

export function sumMacros(entries: MealEntry[], foods: Food[]): Macros {
  const byId = new Map(foods.map((f) => [f.id, f]))
  return entries.reduce<Macros>((acc, e) => {
    const m = macrosFor(byId.get(e.foodId), e.grams)
    return {
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      sugar: acc.sugar + m.sugar,
      fiber: acc.fiber + m.fiber,
      sodium: acc.sodium + m.sodium,
    }
  }, { ...emptyMacros })
}

/**
 * True when at least one item in the day is a warung/street-food estimate, so
 * the UI can flag that the day's totals are approximate.
 */
export function hasEstimate(entries: MealEntry[], foods: Food[]): boolean {
  const byId = new Map(foods.map((f) => [f.id, f]))
  return entries.some((e) => byId.get(e.foodId)?.estimate)
}

/**
 * A day counts as rest when its focus says so. The schedule is free text — the
 * user writes whatever split they train — so the word itself is the marker.
 */
export function isRestDay(focus: string): boolean {
  return /\b(rest|istirahat|libur|off)\b/i.test(focus)
}

export function weekWorkoutStats(data: AppData, iso: string) {
  const week = data.weeks[weekKey(iso)] ?? {}
  // Rest days aren't targets, so they shouldn't drag the percentage down.
  const trainingDays = data.workoutSchedule.filter(
    (cfg) => !isRestDay(week[cfg.day]?.focusOverride || cfg.focus),
  )
  const done = trainingDays.filter((cfg) => week[cfg.day]?.done).length
  const total = trainingDays.length
  return { done, total, percent: total === 0 ? 0 : (done / total) * 100 }
}

export const round1 = (n: number) => Math.round(n * 10) / 10

const idrFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })
export const formatIdr = (n: number) => {
  const rounded = Math.round(n)
  return rounded < 0 ? `-Rp${idrFormatter.format(-rounded)}` : `Rp${idrFormatter.format(rounded)}`
}

/** Sum of everything that has moved cash in or out: income, expense, debt payments, invest buy/sell. */
export function cashBalance(data: AppData): number {
  const txNet = data.transactions.reduce(
    (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount),
    0,
  )
  const debtPaid = data.debts.reduce(
    (acc, d) => acc + d.payments.reduce((s, p) => s + p.amount, 0),
    0,
  )
  const investNet = data.investments.reduce(
    (acc, i) => acc + (i.type === 'buy' ? -i.amountIdr : i.amountIdr),
    0,
  )
  return txNet - debtPaid + investNet
}

export function debtRemaining(debt: Debt): number {
  const paid = debt.payments.reduce((s, p) => s + p.amount, 0)
  return Math.max(0, round1(debt.principal - paid))
}

export function debtProgress(debt: Debt): number {
  if (debt.principal <= 0) return 100
  const paid = debt.principal - debtRemaining(debt)
  return Math.min(100, Math.max(0, (paid / debt.principal) * 100))
}

export function totalDebtRemaining(data: AppData): number {
  return data.debts.reduce((acc, d) => acc + debtRemaining(d), 0)
}

export interface InvestmentPosition {
  unitsHeld: number
  costBasis: number
}

/** Nets buy/sell rows for one instrument into units currently held + remaining cost basis. */
export function investmentPosition(data: AppData, instrument: InstrumentId): InvestmentPosition {
  return data.investments
    .filter((i) => i.instrument === instrument)
    .reduce<InvestmentPosition>(
      (acc, i) => {
        if (i.type === 'buy') {
          return { unitsHeld: acc.unitsHeld + i.units, costBasis: acc.costBasis + i.amountIdr }
        }
        // Sell: remove units and a proportional slice of cost basis.
        const soldUnits = Math.min(i.units, acc.unitsHeld)
        const avgCost = acc.unitsHeld > 0 ? acc.costBasis / acc.unitsHeld : 0
        return {
          unitsHeld: acc.unitsHeld - soldUnits,
          costBasis: Math.max(0, acc.costBasis - avgCost * soldUnits),
        }
      },
      { unitsHeld: 0, costBasis: 0 },
    )
}

/** Cost basis summed across every instrument (used for a quick dashboard P/L estimate). */
export function totalInvestmentCostBasis(data: AppData): number {
  const ids = Array.from(new Set(data.investments.map((i) => i.instrument)))
  return ids.reduce((sum, id) => sum + investmentPosition(data, id).costBasis, 0)
}

/** Most recent recorded portfolio snapshot value, or null if none yet. */
export function latestPortfolioValue(data: AppData): number | null {
  if (data.portfolioSnapshots.length === 0) return null
  return data.portfolioSnapshots[data.portfolioSnapshots.length - 1].totalValue
}

export interface FinanceMonthSummary {
  income: number
  expense: number
  net: number
  byCategory: Record<string, number>
}

/** yyyyMm like "2026-07". */
export function monthlyFinanceSummary(data: AppData, yyyyMm: string): FinanceMonthSummary {
  const rows = data.transactions.filter((t) => t.date.startsWith(yyyyMm))
  const byCategory: Record<string, number> = {}
  let income = 0
  let expense = 0
  for (const t of rows) {
    if (t.type === 'income') income += t.amount
    else expense += t.amount
    byCategory[t.categoryId] = (byCategory[t.categoryId] ?? 0) + t.amount
  }
  return { income, expense, net: income - expense, byCategory }
}

// ---- Water --------------------------------------------------------------

/** Extra millilitres per day by how hard the person trains. */
const ACTIVITY_BONUS_ML: Record<ActivityLevel, number> = {
  ringan: 0,
  sedang: 350,
  berat: 700,
}

export interface WaterTarget {
  ml: number
  /** True when the number came from the weight-based formula, not a manual override. */
  recommended: boolean
  /** Plain-language reason, shown under the target so the number isn't a black box. */
  reason: string
}

/**
 * Daily water target. A manual target always wins; otherwise it is derived from
 * body weight at 30 ml/kg — the common rule of thumb — plus an allowance for
 * training, then clamped to a sane range.
 */
export function waterTarget(w: WaterSettings): WaterTarget {
  if (w.targetMl && w.targetMl > 0) {
    return { ml: w.targetMl, recommended: false, reason: 'Target yang kamu tetapkan sendiri.' }
  }
  if (!w.weightKg) {
    return {
      ml: 2000,
      recommended: true,
      reason: 'Angka umum orang dewasa. Isi berat badan untuk saran yang lebih pas.',
    }
  }
  const base = w.weightKg * 30
  const bonus = ACTIVITY_BONUS_ML[w.activity]
  const ml = Math.round(Math.min(4000, Math.max(1500, base + bonus)) / 50) * 50
  const bonusText = bonus > 0 ? ` + ${bonus} ml untuk aktivitas ${w.activity}` : ''
  return {
    ml,
    recommended: true,
    reason: `${w.weightKg} kg × 30 ml${bonusText}.`,
  }
}

export interface WaterProgress {
  drunkMl: number
  targetMl: number
  percent: number
  /** How many glasses the target works out to. */
  glassesTarget: number
  glassesDone: number
  remainingMl: number
}

export function waterProgress(day: DayLog, w: WaterSettings): WaterProgress {
  const drunkMl = (day.water ?? []).reduce((sum, e) => sum + e.ml, 0)
  const targetMl = waterTarget(w).ml
  const glassMl = w.glassMl > 0 ? w.glassMl : 250
  return {
    drunkMl,
    targetMl,
    percent: targetMl === 0 ? 0 : Math.min(100, (drunkMl / targetMl) * 100),
    glassesTarget: Math.ceil(targetMl / glassMl),
    glassesDone: Math.floor(drunkMl / glassMl),
    remainingMl: Math.max(0, targetMl - drunkMl),
  }
}

/** Reminder clock times spread evenly across the waking window. */
export function reminderTimes(w: WaterSettings): string[] {
  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  const start = toMin(w.wakeTime)
  const end = toMin(w.sleepTime)
  const step = Math.max(15, w.intervalMin)
  if (end <= start) return []
  const out: string[] = []
  for (let t = start; t <= end; t += step) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`)
  }
  return out
}
