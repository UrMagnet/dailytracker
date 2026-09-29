import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { uid } from '../lib/seed'
import { formatIdr, investmentPosition } from '../lib/derive'
import { getPriceForInstrument, type PriceResult } from '../lib/prices'
import type { InstrumentId, InvestmentTx } from '../lib/types'
import { CountUp, EmptyState, SectionTitle, Sparkline, TrashIcon } from './ui'
import { toISODate } from '../lib/date'

const INSTRUMENTS: { id: InstrumentId; label: string; unitLabel: string; unitDecimals: number }[] = [
  { id: 'btc', label: 'Bitcoin (BTC)', unitLabel: 'BTC', unitDecimals: 6 },
  { id: 'lq45', label: 'LQ45', unitLabel: 'poin', unitDecimals: 2 },
  { id: 'emas', label: 'Emas', unitLabel: 'gram', unitDecimals: 3 },
]

export default function FinanceInvestments() {
  const { data, update } = useStore()
  const [prices, setPrices] = useState<Partial<Record<InstrumentId, PriceResult>>>({})
  const [goldKeyInput, setGoldKeyInput] = useState(data.settings.goldApiKey ?? '')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        INSTRUMENTS.map(async (i) => [i.id, await getPriceForInstrument(i.id, data.settings)] as const),
      )
      if (cancelled) return
      setPrices(Object.fromEntries(entries))
    })()
    return () => {
      cancelled = true
    }
    // Re-fetch when the gold API key changes; instrument list is static.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.settings.goldApiKey])

  const positions = useMemo(
    () => Object.fromEntries(INSTRUMENTS.map((i) => [i.id, investmentPosition(data, i.id)])),
    [data],
  )

  const totalValue = INSTRUMENTS.reduce((sum, i) => {
    const price = prices[i.id]?.price ?? 0
    return sum + positions[i.id].unitsHeld * price
  }, 0)
  const totalCost = INSTRUMENTS.reduce((sum, i) => sum + positions[i.id].costBasis, 0)
  const totalPl = totalValue - totalCost

  useEffect(() => {
    const allLoaded = INSTRUMENTS.every((i) => prices[i.id])
    if (!allLoaded) return
    const todayIso = toISODate()
    if (data.portfolioSnapshots.some((s) => s.date === todayIso)) return
    update((d) => {
      d.portfolioSnapshots.push({ date: todayIso, totalValue })
    })
    // Only run once prices finish loading for today; totalValue/update change every render otherwise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prices])

  const saveGoldKey = () => {
    update((d) => {
      d.settings.goldApiKey = goldKeyInput.trim() || undefined
    })
  }

  const snapshotValues = data.portfolioSnapshots.slice(-30).map((s) => s.totalValue)

  return (
    <div className="space-y-4">
      <div className="card">
        <SectionTitle title="Total Portofolio" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold tabular-nums">
              <CountUp value={totalValue} format={formatIdr} />
            </div>
            <div className={`mt-1 text-sm font-medium tabular-nums ${totalPl >= 0 ? 'text-profit' : 'text-loss'}`}>
              {totalPl >= 0 ? '+' : ''}
              {formatIdr(totalPl)} ({totalCost > 0 ? ((totalPl / totalCost) * 100).toFixed(1) : '0.0'}%)
            </div>
          </div>
          {snapshotValues.length >= 2 && <Sparkline values={snapshotValues} width={140} height={40} />}
        </div>
      </div>

      {INSTRUMENTS.map((i) => (
        <InstrumentCard
          key={i.id}
          instrument={i}
          price={prices[i.id]}
          position={positions[i.id]}
          goldKeyInput={goldKeyInput}
          setGoldKeyInput={setGoldKeyInput}
          saveGoldKey={saveGoldKey}
        />
      ))}
    </div>
  )
}

function InstrumentCard({
  instrument,
  price,
  position,
  goldKeyInput,
  setGoldKeyInput,
  saveGoldKey,
}: {
  instrument: (typeof INSTRUMENTS)[number]
  price?: PriceResult
  position: { unitsHeld: number; costBasis: number }
  goldKeyInput: string
  setGoldKeyInput: (v: string) => void
  saveGoldKey: () => void
}) {
  const { data, update } = useStore()
  const [buyAmount, setBuyAmount] = useState('')
  const [sellAmount, setSellAmount] = useState('')

  const currentPrice = price?.price ?? 0
  const currentValue = position.unitsHeld * currentPrice
  const pl = currentValue - position.costBasis
  const plPercent = position.costBasis > 0 ? (pl / position.costBasis) * 100 : 0

  const needsGoldKey = instrument.id === 'emas' && !data.settings.goldApiKey

  const buy = () => {
    const amount = Number(buyAmount)
    if (!amount || amount <= 0 || !currentPrice) return
    const units = amount / currentPrice
    update((d) => {
      d.investments.push({
        id: uid(),
        instrument: instrument.id,
        type: 'buy',
        amountIdr: amount,
        priceAtTx: currentPrice,
        units,
        date: toISODate(),
      } satisfies InvestmentTx)
    })
    setBuyAmount('')
  }

  const sell = () => {
    const amount = Number(sellAmount)
    if (!amount || amount <= 0 || !currentPrice) return
    const units = Math.min(amount / currentPrice, position.unitsHeld)
    if (units <= 0) return
    update((d) => {
      d.investments.push({
        id: uid(),
        instrument: instrument.id,
        type: 'sell',
        amountIdr: units * currentPrice,
        priceAtTx: currentPrice,
        units,
        date: toISODate(),
      } satisfies InvestmentTx)
    })
    setSellAmount('')
  }

  const history = data.investments.filter((tx) => tx.instrument === instrument.id).slice(-5).reverse()

  return (
    <div className="card">
      <SectionTitle
        title={instrument.label}
        subtitle={
          price?.error
            ? price.error
            : currentPrice
              ? `Harga: ${formatIdr(currentPrice)} / ${instrument.unitLabel}${price?.stale ? ' · data terakhir' : ''}`
              : 'Memuat harga…'
        }
      />

      {needsGoldKey ? (
        <div className="space-y-2">
          <label className="label">Gold API key (goldapi.io)</label>
          <div className="flex gap-2">
            <input
              className="field"
              placeholder="API key"
              value={goldKeyInput}
              onChange={(e) => setGoldKeyInput(e.target.value)}
            />
            <button className="btn-primary shrink-0" onClick={saveGoldKey}>
              Simpan
            </button>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Daftar gratis di goldapi.io untuk API key sendiri — disimpan lokal di perangkat ini saja.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Unit dimiliki</div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">
                {position.unitsHeld.toFixed(instrument.unitDecimals)}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Modal</div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">{formatIdr(position.costBasis)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Untung/Rugi</div>
              <div className={`mt-0.5 text-sm font-semibold tabular-nums ${pl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {pl >= 0 ? '+' : ''}
                {formatIdr(pl)} ({plPercent.toFixed(1)}%)
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                buy()
              }}
            >
              <input
                type="number"
                min={0}
                className="field"
                placeholder="Beli (Rp)"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
              />
              <button type="submit" className="btn-primary shrink-0" disabled={!currentPrice}>
                Beli
              </button>
            </form>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                sell()
              }}
            >
              <input
                type="number"
                min={0}
                className="field"
                placeholder="Jual (Rp)"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
              />
              <button type="submit" className="btn-ghost shrink-0" disabled={!currentPrice || position.unitsHeld <= 0}>
                Jual
              </button>
            </form>
          </div>

          {history.length === 0 ? (
            <EmptyState>Belum ada transaksi {instrument.label}.</EmptyState>
          ) : (
            <ul className="mt-3 space-y-1">
              {history.map((tx) => (
                <li key={tx.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800/60">
                  <span className={tx.type === 'buy' ? 'text-loss' : 'text-profit'}>
                    {tx.type === 'buy' ? 'Beli' : 'Jual'}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">{tx.date}</span>
                  <span className="ml-auto tabular-nums">{formatIdr(tx.amountIdr)}</span>
                  <button
                    className="btn-icon h-6 w-6"
                    title="Hapus"
                    onClick={() =>
                      update((d) => {
                        d.investments = d.investments.filter((x) => x.id !== tx.id)
                      })
                    }
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
