import type { AppData, Category, FinanceCategory, Task, WorkoutDayConfig } from './types'
import { FOOD_CATALOG } from './foods'
import { toISODate } from './date'

export const uid = () => Math.random().toString(36).slice(2, 10)

const categories: Category[] = [
  { id: 'content', name: 'Content Creation & Campaign' },
  { id: 'work', name: 'Kerja & Proyek' },
  { id: 'learning', name: 'Belajar / Skill Development' },
  { id: 'growth', name: 'Personal Growth' },
]

const task = (label: string, categoryId: string, subtasks: string[] = []): Task => ({
  id: uid(),
  label,
  categoryId,
  subtasks: subtasks.map((s) => ({ id: uid(), label: s })),
})

const tasks: Task[] = [
  task('Bikin clipper sendiri & campaign (Content Reward — akun luar negeri)', 'content'),
  task('Motionklip & Ternak Klip (akun konten Indo)', 'content'),
  task('Bikin short storytelling YouTube', 'content'),
  task('Bikin faceless AI YouTube', 'content'),
  task('Bikin video kompilasi', 'content'),
  task('Bikin AI Affiliate', 'content'),
  task('Bikin Adobe Stock dari AI', 'content'),
  task('Selesaikan tugas kuliah', 'work'),
  task('Belajar AI', 'learning', [
    'Gemini Flow',
    'CapCut',
    'NotebookLM',
    'Claude',
    'Hermes',
    'Antigravity',
    'GPT',
  ]),
  task('Belajar ekspor', 'learning'),
  task('Baca buku (kalau bisa Alkitab)', 'growth'),
]

const workoutSchedule: WorkoutDayConfig[] = [
  { day: 0, name: 'Senin', focus: 'Push (dada, bahu, triceps)' },
  { day: 1, name: 'Selasa', focus: 'Pull (punggung, biceps)' },
  { day: 2, name: 'Rabu', focus: 'Leg Day' },
  { day: 3, name: 'Kamis', focus: 'Rest' },
  { day: 4, name: 'Jumat', focus: 'Upper Body' },
  { day: 5, name: 'Sabtu', focus: 'Cardio' },
  { day: 6, name: 'Minggu', focus: 'Rest' },
]


const financeCategories: FinanceCategory[] = [
  { id: 'exp-makan', name: 'Makan', type: 'expense' },
  { id: 'exp-transport', name: 'Transport', type: 'expense' },
  { id: 'exp-tagihan', name: 'Tagihan', type: 'expense' },
  { id: 'exp-belanja', name: 'Belanja', type: 'expense' },
  { id: 'exp-hiburan', name: 'Hiburan', type: 'expense' },
  { id: 'exp-lain', name: 'Lain-lain', type: 'expense' },
  { id: 'inc-gaji', name: 'Gaji', type: 'income' },
  { id: 'inc-freelance', name: 'Freelance/Konten', type: 'income' },
  { id: 'inc-bonus', name: 'Bonus', type: 'income' },
  { id: 'inc-lain', name: 'Lain-lain', type: 'income' },
]

export function createSeedData(): AppData {
  return {
    version: 1,
    categories,
    tasks,
    counters: [
      {
        id: uid(),
        title: 'Lupain Mantan & Self-Love (Bersyukur)',
        startValue: 76,
        startDate: toISODate(),
        checkedDates: [],
      },
    ],
    foods: FOOD_CATALOG.map((f) => ({ ...f })),
    workoutSchedule,
    days: {},
    weeks: {},
    financeCategories,
    transactions: [],
    debts: [],
    investments: [],
    portfolioSnapshots: [],
    nutrition: {},
    water: {
      activity: 'sedang',
      glassMl: 250,
      remindersEnabled: false,
      intervalMin: 90,
      wakeTime: '07:00',
      sleepTime: '22:00',
    },
    waterReady: true,
    settings: {},
  }
}
