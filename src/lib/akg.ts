import type { NutritionProfile, Sex } from './types'

/**
 * Angka Kecukupan Gizi (AKG) — Permenkes RI No. 28 Tahun 2019.
 *
 * These are population reference intakes for moderately active people, not
 * personal prescriptions: someone cutting, bulking, pregnant, or managing a
 * medical condition needs different numbers. The UI says so, and lets the
 * energy target be overridden by hand.
 */
interface AkgRow {
  /** Upper bound of the age band, inclusive. */
  maxAge: number
  kcal: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

const AKG: Record<Sex, AkgRow[]> = {
  pria: [
    { maxAge: 12, kcal: 2000, protein: 50, fat: 65, carbs: 300, fiber: 28 },
    { maxAge: 15, kcal: 2400, protein: 70, fat: 80, carbs: 350, fiber: 34 },
    { maxAge: 18, kcal: 2650, protein: 75, fat: 85, carbs: 400, fiber: 37 },
    { maxAge: 29, kcal: 2650, protein: 65, fat: 75, carbs: 430, fiber: 37 },
    { maxAge: 49, kcal: 2550, protein: 65, fat: 70, carbs: 415, fiber: 36 },
    { maxAge: 64, kcal: 2150, protein: 65, fat: 60, carbs: 340, fiber: 30 },
    { maxAge: 200, kcal: 1800, protein: 64, fat: 50, carbs: 275, fiber: 25 },
  ],
  wanita: [
    { maxAge: 12, kcal: 1900, protein: 55, fat: 65, carbs: 280, fiber: 27 },
    { maxAge: 15, kcal: 2050, protein: 65, fat: 70, carbs: 300, fiber: 29 },
    { maxAge: 18, kcal: 2100, protein: 65, fat: 70, carbs: 300, fiber: 29 },
    { maxAge: 29, kcal: 2250, protein: 60, fat: 65, carbs: 360, fiber: 32 },
    { maxAge: 49, kcal: 2150, protein: 60, fat: 60, carbs: 340, fiber: 30 },
    { maxAge: 64, kcal: 1800, protein: 60, fat: 50, carbs: 280, fiber: 25 },
    { maxAge: 200, kcal: 1550, protein: 58, fat: 45, carbs: 230, fiber: 22 },
  ],
}

/**
 * Daily limits, not goals — going under is fine, going over is the warning.
 *
 * Sugar and salt follow Kemenkes "G4 G1 L5" (Permenkes 30/2013): 50 g sugar,
 * 5 g salt (≈2000 mg sodium), 67 g fat per day. WHO's sodium ceiling is the
 * same 2000 mg; its free-sugar guidance is under 10% of energy, ideally under
 * 5%, which at a 2000 kcal intake lands on the same 50 g.
 */
export const DAILY_LIMITS = {
  sugarG: 50,
  sodiumMg: 2000,
}

export interface NutritionTargets {
  kcal: number
  protein: number
  fat: number
  carbs: number
  fiber: number
  sugar: number
  sodium: number
  /** True when the numbers came from AKG rather than a manual override. */
  fromAkg: boolean
  /** Plain-language basis, shown so the numbers aren't a black box. */
  basis: string
}

const DEFAULT_ROW: AkgRow = { maxAge: 200, kcal: 2150, protein: 60, fat: 65, carbs: 340, fiber: 30 }

export function nutritionTargets(profile: NutritionProfile): NutritionTargets {
  const { sex, ageYears, targetKcal } = profile

  const row =
    sex && ageYears
      ? (AKG[sex].find((r) => ageYears <= r.maxAge) ?? AKG[sex][AKG[sex].length - 1])
      : DEFAULT_ROW

  // A manual energy target scales the macro targets with it, so the ratios
  // stay consistent instead of mixing a custom calorie goal with AKG macros.
  const scale = targetKcal && targetKcal > 0 ? targetKcal / row.kcal : 1
  const round = (n: number) => Math.round(n)

  return {
    kcal: round(row.kcal * scale),
    protein: round(row.protein * scale),
    fat: round(row.fat * scale),
    carbs: round(row.carbs * scale),
    fiber: row.fiber,
    sugar: DAILY_LIMITS.sugarG,
    sodium: DAILY_LIMITS.sodiumMg,
    fromAkg: !targetKcal,
    basis:
      targetKcal && targetKcal > 0
        ? 'Target energi yang kamu tetapkan sendiri.'
        : sex && ageYears
          ? `AKG 2019 untuk ${sex} ${ageYears} tahun.`
          : 'Angka umum dewasa. Isi jenis kelamin & usia untuk acuan AKG yang pas.',
  }
}
