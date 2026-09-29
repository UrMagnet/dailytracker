// Server-side CORS proxy for the LQ45 index quote. Yahoo Finance's unofficial
// quote endpoint doesn't send CORS headers, so the browser can't call it directly.
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const upstream = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EJKLQ45', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 120 },
    })
    if (!upstream.ok) {
      return NextResponse.json({ error: `Yahoo Finance ${upstream.status}` }, { status: 502 })
    }
    const json = await upstream.json()
    const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice
    if (!price) {
      return NextResponse.json({ error: 'missing price in upstream response' }, { status: 502 })
    }
    return NextResponse.json(
      { price, currency: 'IDR', fetchedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' } },
    )
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 },
    )
  }
}
