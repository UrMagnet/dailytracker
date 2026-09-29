import type { AppSettings, InstrumentId } from './types'

export interface PriceResult {
  price: number
  fetchedAt: string
  stale: boolean
  /** Set when the price could not be fetched or cached at all (e.g. missing API key). */
  error?: string
}

interface CachedPrice {
  price: number
  fetchedAt: string
}

const CACHE_PREFIX = 'daily-tracker:price:'
const CACHE_TTL_MS = 5 * 60 * 1000
const GRAMS_PER_TROY_OUNCE = 31.1034768

function cacheKey(id: InstrumentId): string {
  return `${CACHE_PREFIX}${id}`
}

function readCache(id: InstrumentId): CachedPrice | null {
  try {
    const raw = localStorage.getItem(cacheKey(id))
    if (!raw) return null
    return JSON.parse(raw) as CachedPrice
  } catch {
    return null
  }
}

function writeCache(id: InstrumentId, price: number): CachedPrice {
  const entry: CachedPrice = { price, fetchedAt: new Date().toISOString() }
  try {
    localStorage.setItem(cacheKey(id), JSON.stringify(entry))
  } catch {
    // Quota errors are non-fatal.
  }
  return entry
}

async function fetchBtcPriceIdr(): Promise<number> {
  const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr')
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
  const json = (await res.json()) as { bitcoin?: { idr?: number } }
  const price = json.bitcoin?.idr
  if (!price) throw new Error('CoinGecko: missing price')
  return price
}

async function fetchLq45PriceIdr(): Promise<number> {
  const res = await fetch('/api/lq45')
  if (!res.ok) throw new Error(`lq45 proxy ${res.status}`)
  const json = (await res.json()) as { price?: number }
  if (!json.price) throw new Error('lq45 proxy: missing price')
  return json.price
}

async function fetchGoldPriceIdrPerGram(apiKey: string): Promise<number> {
  const res = await fetch('https://www.goldapi.io/api/XAU/IDR', {
    headers: { 'x-access-token': apiKey },
  })
  if (!res.ok) throw new Error(`GoldAPI ${res.status}`)
  const json = (await res.json()) as { price?: number }
  if (!json.price) throw new Error('GoldAPI: missing price')
  return json.price / GRAMS_PER_TROY_OUNCE
}

/**
 * Fetches the current IDR price for an instrument, with a localStorage cache
 * (short TTL, to stay under public rate limits) and graceful fallback to the
 * last known value if the network call fails.
 */
export async function getPriceForInstrument(
  id: InstrumentId,
  settings: AppSettings,
): Promise<PriceResult> {
  const cached = readCache(id)
  const cacheFresh = cached && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS
  if (cacheFresh) {
    return { price: cached.price, fetchedAt: cached.fetchedAt, stale: false }
  }

  if (id === 'emas' && !settings.goldApiKey) {
    if (cached) return { price: cached.price, fetchedAt: cached.fetchedAt, stale: true }
    return { price: 0, fetchedAt: '', stale: true, error: 'Tambahkan Gold API key di Settings' }
  }

  try {
    const price =
      id === 'btc'
        ? await fetchBtcPriceIdr()
        : id === 'lq45'
          ? await fetchLq45PriceIdr()
          : await fetchGoldPriceIdrPerGram(settings.goldApiKey!)
    const entry = writeCache(id, price)
    return { price: entry.price, fetchedAt: entry.fetchedAt, stale: false }
  } catch {
    if (cached) return { price: cached.price, fetchedAt: cached.fetchedAt, stale: true }
    return { price: 0, fetchedAt: '', stale: true, error: 'Gagal mengambil harga, coba lagi nanti' }
  }
}
