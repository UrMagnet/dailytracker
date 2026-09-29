export type CategoryId = string

export interface Category {
  id: CategoryId
  name: string
}

export interface SubTask {
  id: string
  label: string
}

export interface Task {
  id: string
  label: string
  categoryId: CategoryId
  /** Optional sub-items, each checked independently (e.g. per AI tool). */
  subtasks: SubTask[]
}

export interface Counter {
  id: string
  title: string
  /** Value the counter shows on `startDate` before any check-in. */
  startValue: number
  /** ISO date (YYYY-MM-DD) the counting started. */
  startDate: string
  /** Every ISO date the user marked as done, ascending. */
  checkedDates: string[]
}

export type MealSlot = 'sarapan' | 'makan-siang' | 'makan-malam' | 'snack'

export type FoodCategory =
  | 'karbo'
  | 'protein-hewani'
  | 'protein-nabati'
  | 'sayur'
  | 'buah'
  | 'jajanan'
  | 'minuman'
  | 'lainnya'

/** A household measure, so nothing has to be weighed on a scale. */
export interface FoodPortion {
  /** e.g. "1 potong sedang", "1 piring", "1 gelas". */
  label: string
  grams: number
}

export interface Food {
  id: string
  name: string
  category: FoodCategory
  /** All values per 100 g (or per 100 ml for drinks). */
  kcal: number
  protein: number
  carbs: number
  fat: number
  /** Total sugars, g per 100 g. */
  sugar?: number
  fiber?: number
  /** Sodium, mg per 100 g. */
  sodium?: number
  note?: string
  portions?: FoodPortion[]
  /**
   * True for warung/restaurant food, where the recipe varies so much that the
   * numbers are a reasonable estimate rather than a measurement.
   */
  estimate?: boolean
}

export type Sex = 'pria' | 'wanita'

/** Drives the AKG (Indonesian RDA) daily targets. */
export interface NutritionProfile {
  sex?: Sex
  ageYears?: number
  /** Manual override of the daily energy target, kcal. */
  targetKcal?: number
}

export interface MealEntry {
  id: string
  foodId: string
  grams: number
  slot: MealSlot
}

/** A single weekday inside one specific week. */
export interface WorkoutDayLog {
  done: boolean
  /** Overrides the default focus for that week only (used by Rabu). */
  focusOverride?: string
  note?: string
}

export interface WorkoutDayConfig {
  /** 0 = Senin … 6 = Minggu */
  day: number
  name: string
  focus: string
  /** When set, the day shows a selector with these alternatives. */
  options?: string[]
}

export interface WaterEntry {
  id: string
  /** Volume in millilitres. */
  ml: number
  /** Local clock time it was logged, `HH:MM`. */
  at: string
}

export type ActivityLevel = 'ringan' | 'sedang' | 'berat'

export interface WaterSettings {
  /** Body weight in kg — the basis of the recommendation. */
  weightKg?: number
  activity: ActivityLevel
  /** Manual daily target in ml. When unset, the recommendation is used. */
  targetMl?: number
  /** Size of one glass, used to split the target into portions. */
  glassMl: number
  remindersEnabled: boolean
  /** Minutes between reminders. */
  intervalMin: number
  /** Reminder window, `HH:MM`. */
  wakeTime: string
  sleepTime: string
}

export interface DayLog {
  /** taskId -> checked (subtasks stored as `${taskId}:${subtaskId}`). */
  tasks: Record<string, boolean>
  meals: MealEntry[]
  water: WaterEntry[]
}

export type FinanceTxType = 'income' | 'expense'

export interface FinanceCategory {
  id: string
  name: string
  type: FinanceTxType
}

export interface FinanceTransaction {
  id: string
  type: FinanceTxType
  /** Rupiah, always positive. */
  amount: number
  categoryId: string
  /** ISO date. */
  date: string
  note?: string
}

export interface DebtPayment {
  id: string
  amount: number
  /** ISO date. */
  date: string
}

export interface Debt {
  id: string
  name: string
  /** Total hutang awal (Rupiah). */
  principal: number
  dueDate?: string
  /** Annual interest rate, percent. Informational only — not compounded automatically. */
  interestRate?: number
  payments: DebtPayment[]
}

export type InstrumentId = 'btc' | 'lq45' | 'emas'

export interface InvestmentTx {
  id: string
  instrument: InstrumentId
  type: 'buy' | 'sell'
  /** Rupiah moved in (buy) or out (sell). */
  amountIdr: number
  /** Reference price per unit at the time of the transaction. */
  priceAtTx: number
  /** Units (BTC, index points-equivalent, or grams) this tx represents. */
  units: number
  /** ISO date. */
  date: string
}

export interface PortfolioSnapshot {
  /** ISO date, one entry per day at most. */
  date: string
  totalValue: number
}

export interface AppSettings {
  goldApiKey?: string
}

export interface AppData {
  version: number
  categories: Category[]
  tasks: Task[]
  counters: Counter[]
  foods: Food[]
  workoutSchedule: WorkoutDayConfig[]
  /** ISO date -> log */
  days: Record<string, DayLog>
  /** ISO week key (YYYY-Www) -> weekday index -> log */
  weeks: Record<string, Record<number, WorkoutDayLog>>
  financeCategories: FinanceCategory[]
  transactions: FinanceTransaction[]
  debts: Debt[]
  investments: InvestmentTx[]
  portfolioSnapshots: PortfolioSnapshot[]
  nutrition: NutritionProfile
  water: WaterSettings
  /**
   * False when the water tables (migration 0002) aren't in the database yet.
   * Runtime capability, not user data — it isn't persisted.
   */
  waterReady: boolean
  settings: AppSettings
}
