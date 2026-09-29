import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../lib/store'
import { uid } from '../lib/seed'
import { debtProgress, debtRemaining, formatIdr } from '../lib/derive'
import type { Debt } from '../lib/types'
import { EmptyState, PlusIcon, ProgressBar, SectionTitle, TrashIcon } from './ui'
import { Confetti } from './Confetti'
import { formatLong } from '../lib/date'

export default function FinanceDebts() {
  const { data, update } = useStore()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', principal: '', dueDate: '', interestRate: '' })

  const createDebt = () => {
    const name = form.name.trim()
    const principal = Number(form.principal)
    if (!name || !principal || principal <= 0) return
    update((d) => {
      d.debts.push({
        id: uid(),
        name,
        principal,
        dueDate: form.dueDate || undefined,
        interestRate: form.interestRate ? Number(form.interestRate) : undefined,
        payments: [],
      } satisfies Debt)
    })
    setForm({ name: '', principal: '', dueDate: '', interestRate: '' })
    setCreating(false)
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <SectionTitle
          title="Kartu Kredit / Hutang"
          action={
            <button className="btn-ghost" onClick={() => setCreating((v) => !v)}>
              <PlusIcon /> Hutang
            </button>
          }
        />
        {creating && (
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              createDebt()
            }}
          >
            <div className="sm:col-span-2">
              <label className="label">Nama</label>
              <input
                autoFocus
                className="field"
                placeholder="Misal: Kartu Kredit BCA"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Total hutang awal (Rp)</label>
              <input
                type="number"
                min={0}
                className="field"
                value={form.principal}
                onChange={(e) => setForm((f) => ({ ...f, principal: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Jatuh tempo (opsional)</label>
              <input
                type="date"
                className="field"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Bunga % (opsional)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                className="field"
                value={form.interestRate}
                onChange={(e) => setForm((f) => ({ ...f, interestRate: e.target.value }))}
              />
            </div>
            <div className="flex items-end sm:col-span-2">
              <button type="submit" className="btn-primary w-full">
                Buat
              </button>
            </div>
          </form>
        )}
        {!creating && data.debts.length === 0 && (
          <EmptyState>Belum ada hutang tercatat. Bagus, atau tambah satu untuk mulai melacak.</EmptyState>
        )}
      </div>

      <AnimatePresence initial={false}>
        {data.debts.map((debt) => (
          <motion.div
            key={debt.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <DebtCard debt={debt} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function DebtCard({ debt }: { debt: Debt }) {
  const { update } = useStore()
  const [amount, setAmount] = useState('')
  const [justPaidOff, setJustPaidOff] = useState(false)

  const remaining = debtRemaining(debt)
  const progress = debtProgress(debt)
  const paidOff = remaining <= 0

  const pay = () => {
    const value = Number(amount)
    if (!value || value <= 0) return
    const wasPaidOff = remaining <= 0
    update((d) => {
      const target = d.debts.find((x) => x.id === debt.id)
      if (!target) return
      target.payments.push({ id: uid(), amount: value, date: new Date().toISOString().slice(0, 10) })
    })
    setAmount('')
    const newRemaining = debtRemaining({ ...debt, payments: [...debt.payments, { id: 'x', amount: value, date: '' }] })
    if (!wasPaidOff && newRemaining <= 0) {
      setJustPaidOff(true)
      setTimeout(() => setJustPaidOff(false), 800)
    }
  }

  return (
    <div className="card relative">
      {justPaidOff && <Confetti />}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold leading-tight">{debt.name}</h3>
          {debt.dueDate && (
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Jatuh tempo {formatLong(debt.dueDate)}
            </p>
          )}
        </div>
        {paidOff ? (
          <span className="chip-success shrink-0">✓ Lunas</span>
        ) : (
          <span className="chip-danger shrink-0">Belum lunas</span>
        )}
        <button
          className="btn-icon shrink-0"
          title="Hapus"
          onClick={() => {
            if (!confirm(`Hapus hutang "${debt.name}"?`)) return
            update((d) => {
              d.debts = d.debts.filter((x) => x.id !== debt.id)
            })
          }}
        >
          <TrashIcon />
        </button>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>Sisa {formatIdr(remaining)}</span>
          <span>{Math.round(progress)}% terbayar</span>
        </div>
        <ProgressBar percent={progress} />
      </div>

      {!paidOff && (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            pay()
          }}
        >
          <input
            type="number"
            min={0}
            className="field"
            placeholder="Nominal setor"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button type="submit" className="btn-primary shrink-0">
            Setor / Bayar
          </button>
        </form>
      )}
    </div>
  )
}
