import { supabase } from './supabase'
import type { AppData, WorkoutDayLog } from './types'
import { createSeedData } from './seed'

type Row = Record<string, unknown>

/** PostgREST code for "this table isn't in the schema — migration not run yet". */
const MISSING_TABLE = 'PGRST205'
/** PostgREST code for "this column isn't in the schema" — same cause. */
const MISSING_COLUMN = 'PGRST204'

function diffRows<T extends Row>(prevRows: T[], nextRows: T[], keyFn: (r: T) => string) {
  const prevMap = new Map(prevRows.map((r) => [keyFn(r), r]))
  const nextMap = new Map(nextRows.map((r) => [keyFn(r), r]))
  const upserts: T[] = []
  for (const [k, row] of nextMap) {
    const old = prevMap.get(k)
    if (!old || JSON.stringify(old) !== JSON.stringify(row)) upserts.push(row)
  }
  const deletes: T[] = []
  for (const [k, row] of prevMap) {
    if (!nextMap.has(k)) deletes.push(row)
  }
  return { upserts, deletes }
}

// ---- Row shape mappers: AppData slice -> flat DB rows -------------------

const mapCategories = (d: AppData) => d.categories.map((c) => ({ id: c.id, name: c.name }))
const mapTasks = (d: AppData) =>
  d.tasks.map((t) => ({ id: t.id, category_id: t.categoryId, label: t.label, subtasks: t.subtasks }))
const mapCounters = (d: AppData) =>
  d.counters.map((c) => ({
    id: c.id,
    title: c.title,
    start_value: c.startValue,
    start_date: c.startDate,
    checked_dates: c.checkedDates,
  }))
const mapWorkoutSchedule = (d: AppData) =>
  d.workoutSchedule.map((w) => ({ day: w.day, name: w.name, focus: w.focus, options: w.options ?? null }))
const mapFoods = (d: AppData) =>
  d.foods.map((f) => ({
    id: f.id,
    name: f.name,
    category: f.category,
    kcal: f.kcal,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    sugar: f.sugar ?? null,
    fiber: f.fiber ?? null,
    sodium: f.sodium ?? null,
    note: f.note ?? null,
    portions: f.portions ?? null,
    estimate: f.estimate ?? false,
  }))
const mapFinanceCategories = (d: AppData) => d.financeCategories.map((c) => ({ id: c.id, name: c.name, type: c.type }))
const mapTransactions = (d: AppData) =>
  d.transactions.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    category_id: t.categoryId,
    date: t.date,
    note: t.note ?? null,
  }))
const mapDebts = (d: AppData) =>
  d.debts.map((deb) => ({
    id: deb.id,
    name: deb.name,
    principal: deb.principal,
    due_date: deb.dueDate ?? null,
    interest_rate: deb.interestRate ?? null,
  }))
const mapDebtPayments = (d: AppData) =>
  d.debts.flatMap((deb) => deb.payments.map((p) => ({ id: p.id, debt_id: deb.id, amount: p.amount, date: p.date })))
const mapInvestments = (d: AppData) =>
  d.investments.map((tx) => ({
    id: tx.id,
    instrument: tx.instrument,
    type: tx.type,
    amount_idr: tx.amountIdr,
    price_at_tx: tx.priceAtTx,
    units: tx.units,
    date: tx.date,
  }))
const mapPortfolioSnapshots = (d: AppData) => d.portfolioSnapshots.map((s) => ({ date: s.date, total_value: s.totalValue }))
const mapTaskCompletions = (d: AppData) =>
  Object.entries(d.days).flatMap(([date, day]) =>
    Object.entries(day.tasks)
      .filter(([, checked]) => checked)
      .map(([taskKey]) => ({ date, task_key: taskKey, checked: true })),
  )
const mapMealEntries = (d: AppData) =>
  Object.entries(d.days).flatMap(([date, day]) =>
    day.meals.map((m) => ({ id: m.id, date, food_id: m.foodId, grams: m.grams, slot: m.slot })),
  )
const mapWaterEntries = (d: AppData) =>
  Object.entries(d.days).flatMap(([date, day]) =>
    (day.water ?? []).map((e) => ({ id: e.id, date, ml: e.ml, at: e.at })),
  )
const mapWorkoutLogs = (d: AppData) =>
  Object.entries(d.weeks).flatMap(([weekKey, week]) =>
    Object.entries(week).map(([dayIndex, log]) => ({
      week_key: weekKey,
      day_index: Number(dayIndex),
      done: log.done,
      focus_override: log.focusOverride ?? null,
      note: log.note ?? null,
    })),
  )

interface TableSync {
  table: string
  /** Columns the upsert conflicts on — the table's composite primary key. */
  onConflict: string
  /**
   * Foreign-key depth. A row can only be inserted once its parent exists, so
   * parents (depth 0) must be written before children (depth 1). Deletes run
   * in the reverse order for the same reason.
   */
  depth: 0 | 1
  prevRows: Row[]
  nextRows: Row[]
  keyFn: (r: Row) => string
  matchKeys: (r: Row) => Row
}

export interface SyncResult {
  ok: boolean
  /** Human-readable reason, shown in the UI when a write fails. */
  error?: string
}

const byId = (r: Row) => `${r.id}`
const matchId = (r: Row) => ({ id: r.id })

/** Diffs `prev` vs `next` and pushes only the changed rows to Supabase. */
export async function persistDiff(userId: string, prev: AppData, next: AppData): Promise<SyncResult> {
  const tables: TableSync[] = [
    // depth 0 — no foreign keys of their own, so they go first.
    { table: 'categories', onConflict: 'user_id,id', depth: 0, prevRows: mapCategories(prev), nextRows: mapCategories(next), keyFn: byId, matchKeys: matchId },
    { table: 'foods', onConflict: 'user_id,id', depth: 0, prevRows: mapFoods(prev), nextRows: mapFoods(next), keyFn: byId, matchKeys: matchId },
    { table: 'finance_categories', onConflict: 'user_id,id', depth: 0, prevRows: mapFinanceCategories(prev), nextRows: mapFinanceCategories(next), keyFn: byId, matchKeys: matchId },
    { table: 'debts', onConflict: 'user_id,id', depth: 0, prevRows: mapDebts(prev), nextRows: mapDebts(next), keyFn: byId, matchKeys: matchId },
    { table: 'counters', onConflict: 'user_id,id', depth: 0, prevRows: mapCounters(prev), nextRows: mapCounters(next), keyFn: byId, matchKeys: matchId },
    { table: 'workout_schedule', onConflict: 'user_id,day', depth: 0, prevRows: mapWorkoutSchedule(prev), nextRows: mapWorkoutSchedule(next), keyFn: (r) => `${r.day}`, matchKeys: (r) => ({ day: r.day }) },
    { table: 'investments', onConflict: 'user_id,id', depth: 0, prevRows: mapInvestments(prev), nextRows: mapInvestments(next), keyFn: byId, matchKeys: matchId },
    { table: 'portfolio_snapshots', onConflict: 'user_id,date', depth: 0, prevRows: mapPortfolioSnapshots(prev), nextRows: mapPortfolioSnapshots(next), keyFn: (r) => `${r.date}`, matchKeys: (r) => ({ date: r.date }) },
    { table: 'task_completions', onConflict: 'user_id,date,task_key', depth: 0, prevRows: mapTaskCompletions(prev), nextRows: mapTaskCompletions(next), keyFn: (r) => `${r.date}:${r.task_key}`, matchKeys: (r) => ({ date: r.date, task_key: r.task_key }) },
    { table: 'workout_logs', onConflict: 'user_id,week_key,day_index', depth: 0, prevRows: mapWorkoutLogs(prev), nextRows: mapWorkoutLogs(next), keyFn: (r) => `${r.week_key}:${r.day_index}`, matchKeys: (r) => ({ week_key: r.week_key, day_index: r.day_index }) },
    { table: 'water_entries', onConflict: 'user_id,id', depth: 0, prevRows: mapWaterEntries(prev), nextRows: mapWaterEntries(next), keyFn: byId, matchKeys: matchId },

    // depth 1 — each references a depth-0 table above.
    { table: 'tasks', onConflict: 'user_id,id', depth: 1, prevRows: mapTasks(prev), nextRows: mapTasks(next), keyFn: byId, matchKeys: matchId },
    { table: 'meal_entries', onConflict: 'user_id,id', depth: 1, prevRows: mapMealEntries(prev), nextRows: mapMealEntries(next), keyFn: byId, matchKeys: matchId },
    { table: 'debt_payments', onConflict: 'user_id,id', depth: 1, prevRows: mapDebtPayments(prev), nextRows: mapDebtPayments(next), keyFn: byId, matchKeys: matchId },
    { table: 'finance_transactions', onConflict: 'user_id,id', depth: 1, prevRows: mapTransactions(prev), nextRows: mapTransactions(next), keyFn: byId, matchKeys: matchId },
  ]

  const errors: string[] = []
  const run = async (
    label: string,
    job: PromiseLike<{ error: { message: string; code?: string } | null }>,
  ) => {
    const { error } = await job
    if (!error) return
    // A table that doesn't exist yet means a migration hasn't been applied.
    // That's a missing feature, not lost data — the rest must still save.
    if (error.code === MISSING_TABLE) return
    // A missing column is the same story, but it does block this table's write,
    // so say plainly what fixes it instead of leaking the Postgres wording.
    if (error.code === MISSING_COLUMN) {
      errors.push(
        `Database belum diperbarui: tabel "${label.replace('simpan ', '')}" kekurangan kolom baru. ` +
          'Jalankan migration terbaru dari folder supabase/migrations di Supabase SQL Editor.',
      )
      return
    }
    errors.push(`${label}: ${error.message}`)
  }

  // Phase 1 — insert/update parents, then children. Running these in the wrong
  // order makes Postgres reject the child row for pointing at a parent that
  // does not exist yet, which silently drops the write.
  for (const depth of [0, 1] as const) {
    await Promise.all(
      tables
        .filter((t) => t.depth === depth)
        .map(async (t) => {
          const { upserts } = diffRows(t.prevRows, t.nextRows, t.keyFn)
          if (upserts.length === 0) return
          await run(
            `simpan ${t.table}`,
            supabase
              .from(t.table)
              .upsert(upserts.map((r) => ({ ...r, user_id: userId })), { onConflict: t.onConflict }),
          )
        }),
    )
  }

  // Phase 2 — delete children before parents, the mirror of the insert order.
  for (const depth of [1, 0] as const) {
    await Promise.all(
      tables
        .filter((t) => t.depth === depth)
        .map(async (t) => {
          const { deletes } = diffRows(t.prevRows, t.nextRows, t.keyFn)
          for (const row of deletes) {
            await run(
              `hapus ${t.table}`,
              supabase.from(t.table).delete().match({ ...t.matchKeys(row), user_id: userId }),
            )
          }
        }),
    )
  }

  // Settings is a single row per user, always upserted wholesale (never deleted).
  if (
    JSON.stringify(prev.settings) !== JSON.stringify(next.settings) ||
    JSON.stringify(prev.nutrition) !== JSON.stringify(next.nutrition)
  ) {
    await run(
      'simpan settings',
      supabase.from('settings').upsert(
        {
          user_id: userId,
          gold_api_key: next.settings.goldApiKey ?? null,
          sex: next.nutrition.sex ?? null,
          age_years: next.nutrition.ageYears ?? null,
          target_kcal: next.nutrition.targetKcal ?? null,
        },
        { onConflict: 'user_id' },
      ),
    )
  }

  if (JSON.stringify(prev.water) !== JSON.stringify(next.water)) {
    const w = next.water
    await run(
      'simpan pengaturan minum',
      supabase.from('water_settings').upsert(
        {
          user_id: userId,
          weight_kg: w.weightKg ?? null,
          activity: w.activity,
          target_ml: w.targetMl ?? null,
          glass_ml: w.glassMl,
          reminders_enabled: w.remindersEnabled,
          interval_min: w.intervalMin,
          wake_time: w.wakeTime,
          sleep_time: w.sleepTime,
        },
        { onConflict: 'user_id' },
      ),
    )
  }

  if (errors.length > 0) {
    console.error('Supabase sync error', errors)
    return { ok: false, error: errors[0] }
  }
  return { ok: true }
}

// ---- Loading ---------------------------------------------------------

export async function loadAppData(userId: string): Promise<AppData> {
  const [
    categories,
    tasks,
    counters,
    workoutSchedule,
    foods,
    financeCategories,
    debts,
    debtPayments,
    transactions,
    investments,
    portfolioSnapshots,
    taskCompletions,
    mealEntries,
    workoutLogs,
    settings,
    waterEntries,
    waterSettings,
  ] = await Promise.all([
    supabase.from('categories').select('*').eq('user_id', userId),
    supabase.from('tasks').select('*').eq('user_id', userId),
    supabase.from('counters').select('*').eq('user_id', userId),
    supabase.from('workout_schedule').select('*').eq('user_id', userId),
    supabase.from('foods').select('*').eq('user_id', userId),
    supabase.from('finance_categories').select('*').eq('user_id', userId),
    supabase.from('debts').select('*').eq('user_id', userId),
    supabase.from('debt_payments').select('*').eq('user_id', userId),
    supabase.from('finance_transactions').select('*').eq('user_id', userId),
    supabase.from('investments').select('*').eq('user_id', userId),
    supabase.from('portfolio_snapshots').select('*').eq('user_id', userId),
    supabase.from('task_completions').select('*').eq('user_id', userId),
    supabase.from('meal_entries').select('*').eq('user_id', userId),
    supabase.from('workout_logs').select('*').eq('user_id', userId),
    supabase.from('settings').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('water_entries').select('*').eq('user_id', userId),
    supabase.from('water_settings').select('*').eq('user_id', userId).maybeSingle(),
  ])

  // A failed read must never be mistaken for an empty account — seeding on top
  // of a network blip would show the user a fresh app instead of their data.
  // Core tables only: a water table that doesn't exist yet is handled below.
  const failed = [
    categories, tasks, counters, workoutSchedule, foods, financeCategories,
    debts, debtPayments, transactions, investments, portfolioSnapshots,
    taskCompletions, mealEntries, workoutLogs,
  ].find((r) => r.error)
  if (failed?.error) {
    throw new Error(`Gagal memuat data: ${failed.error.message}`)
  }

  // The water tables arrive in migration 0002. Until it runs, the rest of the
  // app must keep working — the Minum tab explains what to do.
  const waterMissing =
    waterEntries.error?.code === MISSING_TABLE || waterSettings.error?.code === MISSING_TABLE
  if (!waterMissing && waterEntries.error) {
    throw new Error(`Gagal memuat data: ${waterEntries.error.message}`)
  }

  // Genuinely empty account — seed it once, both locally and remotely.
  if ((categories.data ?? []).length === 0) {
    const seed = createSeedData()
    const result = await persistDiff(userId, createSeedData0(), seed)
    if (!result.ok) throw new Error(`Gagal menyiapkan data awal: ${result.error}`)
    return seed
  }

  const days: AppData['days'] = {}
  for (const row of taskCompletions.data ?? []) {
    const day = (days[row.date as string] ??= { tasks: {}, meals: [], water: [] })
    day.tasks[row.task_key as string] = true
  }
  for (const row of mealEntries.data ?? []) {
    const day = (days[row.date as string] ??= { tasks: {}, meals: [], water: [] })
    day.meals.push({ id: row.id, foodId: row.food_id, grams: row.grams, slot: row.slot })
  }
  for (const row of waterEntries.data ?? []) {
    const day = (days[row.date as string] ??= { tasks: {}, meals: [], water: [] })
    day.water.push({ id: row.id, ml: row.ml, at: row.at })
  }
  for (const day of Object.values(days)) {
    day.water.sort((a, b) => a.at.localeCompare(b.at))
  }

  const weeks: AppData['weeks'] = {}
  for (const row of workoutLogs.data ?? []) {
    const week = (weeks[row.week_key as string] ??= {})
    const log: WorkoutDayLog = { done: row.done }
    if (row.focus_override) log.focusOverride = row.focus_override
    if (row.note) log.note = row.note
    week[row.day_index as number] = log
  }

  const debtsById = new Map((debts.data ?? []).map((d) => [d.id, { ...d, payments: [] as unknown[] }]))
  for (const p of debtPayments.data ?? []) {
    debtsById.get(p.debt_id as string)?.payments.push({ id: p.id, amount: p.amount, date: p.date })
  }

  return {
    version: 1,
    categories: (categories.data ?? []).map((c) => ({ id: c.id, name: c.name })),
    tasks: (tasks.data ?? []).map((t) => ({ id: t.id, categoryId: t.category_id, label: t.label, subtasks: t.subtasks ?? [] })),
    counters: (counters.data ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      startValue: c.start_value,
      startDate: c.start_date,
      checkedDates: c.checked_dates ?? [],
    })),
    foods: (foods.data ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      category: f.category ?? 'lainnya',
      kcal: f.kcal,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      sugar: f.sugar ?? undefined,
      fiber: f.fiber ?? undefined,
      sodium: f.sodium ?? undefined,
      note: f.note ?? undefined,
      portions: f.portions ?? undefined,
      estimate: f.estimate ?? false,
    })),
    workoutSchedule: (workoutSchedule.data ?? [])
      .map((w) => ({ day: w.day, name: w.name, focus: w.focus, options: w.options ?? undefined }))
      .sort((a, b) => a.day - b.day),
    days,
    weeks,
    financeCategories: (financeCategories.data ?? []).map((c) => ({ id: c.id, name: c.name, type: c.type })),
    transactions: (transactions.data ?? []).map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      categoryId: t.category_id,
      date: t.date,
      note: t.note ?? undefined,
    })),
    debts: [...debtsById.values()].map((d) => ({
      id: d.id as string,
      name: d.name as string,
      principal: d.principal as number,
      dueDate: (d.due_date as string) ?? undefined,
      interestRate: (d.interest_rate as number) ?? undefined,
      payments: d.payments as { id: string; amount: number; date: string }[],
    })),
    investments: (investments.data ?? []).map((tx) => ({
      id: tx.id,
      instrument: tx.instrument,
      type: tx.type,
      amountIdr: tx.amount_idr,
      priceAtTx: tx.price_at_tx,
      units: tx.units,
      date: tx.date,
    })),
    portfolioSnapshots: (portfolioSnapshots.data ?? []).map((s) => ({ date: s.date, totalValue: s.total_value })),
    waterReady: !waterMissing,
    water: waterSettings.data
      ? {
          weightKg: waterSettings.data.weight_kg ?? undefined,
          activity: waterSettings.data.activity,
          targetMl: waterSettings.data.target_ml ?? undefined,
          glassMl: waterSettings.data.glass_ml,
          remindersEnabled: waterSettings.data.reminders_enabled,
          intervalMin: waterSettings.data.interval_min,
          wakeTime: waterSettings.data.wake_time,
          sleepTime: waterSettings.data.sleep_time,
        }
      : createSeedData().water,
    nutrition: {
      sex: settings.data?.sex ?? undefined,
      ageYears: settings.data?.age_years ?? undefined,
      targetKcal: settings.data?.target_kcal ?? undefined,
    },
    settings: { goldApiKey: settings.data?.gold_api_key ?? undefined },
  }
}

/**
 * Coerces a raw JSON blob exported from the old localStorage build into a
 * complete AppData, filling in anything an older version didn't write.
 */
export function normalizeAppData(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') throw new Error('File tidak berisi data Daily Tracker.')
  const p = raw as Partial<AppData>
  const empty = createSeedData0()
  const data: AppData = {
    version: 1,
    categories: p.categories ?? empty.categories,
    tasks: p.tasks ?? empty.tasks,
    counters: p.counters ?? empty.counters,
    foods: p.foods ?? empty.foods,
    workoutSchedule: p.workoutSchedule ?? empty.workoutSchedule,
    days: p.days ?? {},
    weeks: p.weeks ?? {},
    financeCategories: p.financeCategories ?? empty.financeCategories,
    transactions: p.transactions ?? [],
    debts: p.debts ?? [],
    investments: p.investments ?? [],
    portfolioSnapshots: p.portfolioSnapshots ?? [],
    nutrition: p.nutrition ?? {},
    water: p.water ?? createSeedData().water,
    waterReady: true,
    settings: p.settings ?? {},
  }
  const hasSomething =
    data.categories.length + data.tasks.length + data.counters.length + data.foods.length > 0
  if (!hasSomething) throw new Error('File tidak berisi data Daily Tracker.')
  return data
}

/** Human-readable tally of what an import will bring in. */
export function summarize(d: AppData) {
  return [
    { label: 'Kategori', n: d.categories.length },
    { label: 'Task', n: d.tasks.length },
    { label: 'Counter', n: d.counters.length },
    { label: 'Bahan makanan', n: d.foods.length },
    { label: 'Hari tercatat', n: Object.keys(d.days).length },
    { label: 'Minggu workout', n: Object.keys(d.weeks).length },
    { label: 'Transaksi', n: d.transactions.length },
    { label: 'Hutang', n: d.debts.length },
    { label: 'Transaksi investasi', n: d.investments.length },
  ].filter((x) => x.n > 0)
}

/**
 * Replaces everything in the account with `incoming`. Used by the importer to
 * bring data across from the old localStorage-only build.
 */
export async function replaceAllData(userId: string, incoming: AppData): Promise<SyncResult> {
  const current = await loadAppData(userId)
  return persistDiff(userId, current, incoming)
}

/** An all-empty AppData, used as the "prev" baseline when seeding a brand new account. */
function createSeedData0(): AppData {
  return {
    version: 1,
    categories: [],
    tasks: [],
    counters: [],
    foods: [],
    workoutSchedule: [],
    days: {},
    weeks: {},
    financeCategories: [],
    transactions: [],
    debts: [],
    investments: [],
    portfolioSnapshots: [],
    nutrition: {},
    water: createSeedData().water,
    waterReady: true,
    settings: {},
  }
}
