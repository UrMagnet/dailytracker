import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../lib/store'
import { uid } from '../lib/seed'
import { formatIdr, monthlyFinanceSummary } from '../lib/derive'
import type { FinanceTxType } from '../lib/types'
import { EmptyState, PlusIcon, SectionTitle, TrashIcon } from './ui'

const DONUT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e']

function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

function shiftMonth(yyyyMm: string, delta: number): string {
  const [y, m] = yyyyMm.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function FinanceTransactions() {
  const { data, update, today } = useStore()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [form, setForm] = useState({
    type: 'expense' as FinanceTxType,
    amount: '',
    categoryId: '',
    date: today,
    note: '',
  })

  const categoriesForType = data.financeCategories.filter((c) => c.type === form.type)
  const summary = monthlyFinanceSummary(data, month)
  const monthRows = useMemo(
    () =>
      data.transactions
        .filter((t) => t.date.startsWith(month))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.transactions, month],
  )

  const catName = (id: string) => data.financeCategories.find((c) => c.id === id)?.name ?? id
  const breakdown = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])
  const breakdownTotal = breakdown.reduce((s, [, v]) => s + v, 0) || 1
  let acc = 0
  const gradientStops = breakdown
    .map(([, v], i) => {
      const start = (acc / breakdownTotal) * 100
      acc += v
      const end = (acc / breakdownTotal) * 100
      return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${start}% ${end}%`
    })
    .join(', ')

  const addTransaction = () => {
    const amount = Number(form.amount)
    if (!amount || amount <= 0 || !form.categoryId) return
    update((d) => {
      d.transactions.push({
        id: uid(),
        type: form.type,
        amount,
        categoryId: form.categoryId,
        date: form.date,
        note: form.note.trim() || undefined,
      })
    })
    setForm((f) => ({ ...f, amount: '', note: '' }))
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <SectionTitle title="Tambah Transaksi" />
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            addTransaction()
          }}
        >
          <div className="flex gap-2 sm:col-span-2">
            {(['expense', 'income'] as FinanceTxType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t, categoryId: '' }))}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  form.type === t
                    ? t === 'income'
                      ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300'
                      : 'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-300'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                {t === 'income' ? 'Penghasilan' : 'Pengeluaran'}
              </button>
            ))}
          </div>
          <div>
            <label className="label">Jumlah (Rp)</label>
            <input
              type="number"
              min={0}
              className="field"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Kategori</label>
            <select
              className="field"
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            >
              <option value="">Pilih kategori</option>
              {categoriesForType.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tanggal</label>
            <input
              type="date"
              className="field"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Catatan (opsional)</label>
            <input
              className="field"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary w-full">
              <PlusIcon /> Tambah
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <SectionTitle
          title="Ringkasan Bulanan"
          subtitle={monthLabel(month)}
          action={
            <div className="flex gap-1">
              <button className="btn-icon" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Bulan sebelumnya">
                ‹
              </button>
              <button className="btn-icon" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="Bulan berikutnya">
                ›
              </button>
            </div>
          }
        />
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Income</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums text-profit">{formatIdr(summary.income)}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Expense</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums text-loss">{formatIdr(summary.expense)}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Net</div>
            <div className={`mt-0.5 text-lg font-semibold tabular-nums ${summary.net >= 0 ? 'text-profit' : 'text-loss'}`}>
              {formatIdr(summary.net)}
            </div>
          </div>
        </div>

        {breakdown.length > 0 && (
          <div className="mt-5 flex items-center gap-5">
            <div
              className="h-24 w-24 shrink-0 rounded-full"
              style={{ background: `conic-gradient(${gradientStops})` }}
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              {breakdown.map(([id, v], i) => (
                <div key={id} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  />
                  <span className="truncate text-neutral-600 dark:text-neutral-300">{catName(id)}</span>
                  <span className="ml-auto shrink-0 tabular-nums text-neutral-500 dark:text-neutral-400">
                    {formatIdr(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <SectionTitle title="Riwayat Transaksi" subtitle={monthLabel(month)} />
        {monthRows.length === 0 ? (
          <EmptyState>Belum ada transaksi bulan ini.</EmptyState>
        ) : (
          <ul className="space-y-1">
            <AnimatePresence initial={false}>
              {monthRows.map((t) => (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{catName(t.categoryId)}</div>
                    <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {t.date}
                      {t.note ? ` · ${t.note}` : ''}
                    </div>
                  </div>
                  <div className={`shrink-0 text-sm font-semibold tabular-nums ${t.type === 'income' ? 'text-profit' : 'text-loss'}`}>
                    {t.type === 'income' ? '+' : '-'}
                    {formatIdr(t.amount)}
                  </div>
                  <button
                    className="btn-icon"
                    title="Hapus"
                    onClick={() =>
                      update((d) => {
                        d.transactions = d.transactions.filter((x) => x.id !== t.id)
                      })
                    }
                  >
                    <TrashIcon />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
