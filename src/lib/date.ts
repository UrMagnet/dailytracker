/** Local-time ISO date string (YYYY-MM-DD) — never UTC, to avoid off-by-one days. */
export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, delta: number): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + delta)
  return toISODate(d)
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = fromISODate(fromIso).getTime()
  const b = fromISODate(toIso).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** 0 = Senin … 6 = Minggu */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

/** Monday of the week containing `iso`. */
export function weekStart(iso: string): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() - mondayIndex(d))
  return toISODate(d)
}

/** ISO-8601 week key, e.g. 2026-W31. Weeks are keyed so history stays stable. */
export function weekKey(iso: string): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() - mondayIndex(d) + 3) // Thursday decides the year
  const year = d.getFullYear()
  const firstThursday = new Date(year, 0, 4)
  firstThursday.setDate(firstThursday.getDate() - mondayIndex(firstThursday) + 3)
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000))
  return `${year}-W${String(week).padStart(2, '0')}`
}

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export function formatLong(iso: string): string {
  const d = fromISODate(iso)
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

export function formatShort(iso: string): string {
  const d = fromISODate(iso)
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`
}

export function relativeLabel(iso: string): string {
  const diff = daysBetween(toISODate(), iso)
  if (diff === 0) return 'Hari ini'
  if (diff === -1) return 'Kemarin'
  if (diff === 1) return 'Besok'
  return formatShort(iso)
}
