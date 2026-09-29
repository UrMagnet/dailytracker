import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../lib/store'
import { cashBalance, formatIdr, totalDebtRemaining } from '../lib/derive'
import { CountUp } from './ui'
import FinanceTransactions from './FinanceTransactions'
import FinanceDebts from './FinanceDebts'
import FinanceInvestments from './FinanceInvestments'

type FinanceSubTab = 'transaksi' | 'hutang' | 'investasi'

const SUB_TABS: { id: FinanceSubTab; label: string }[] = [
  { id: 'transaksi', label: 'Transaksi' },
  { id: 'hutang', label: 'Hutang' },
  { id: 'investasi', label: 'Investasi' },
]

export default function Finance() {
  const { data } = useStore()
  const [sub, setSub] = useState<FinanceSubTab>('transaksi')

  const balance = cashBalance(data)
  const debt = totalDebtRemaining(data)

  return (
    <div className="space-y-4">
      <div className="card-accent">
        <div className="text-xs font-medium uppercase tracking-wide text-white/70">Saldo Utama</div>
        <div className="mt-1 text-3xl font-semibold tabular-nums">
          <CountUp value={balance} format={formatIdr} />
        </div>
        <div className="mt-3 flex gap-4 text-xs text-white/80">
          <span>Total hutang tersisa: {formatIdr(debt)}</span>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              sub === t.id
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={sub}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {sub === 'transaksi' && <FinanceTransactions />}
          {sub === 'hutang' && <FinanceDebts />}
          {sub === 'investasi' && <FinanceInvestments />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
