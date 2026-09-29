import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Beli akses lifetime Daily Tracker — Rp20.000, sekali bayar.',
  alternates: { canonical: '/checkout' },
}

// PLACEHOLDER — Tahap 5 replaces this with the real Xendit Invoice flow:
// email form -> POST /api/checkout -> create Xendit invoice -> redirect to
// invoice_url -> Xendit webhook creates the account and emails the access link.
export default function CheckoutPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="card w-full max-w-sm text-center">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          ✅ Daily Tracker
        </Link>
        <h1 className="mt-4 text-lg font-semibold">Checkout belum aktif</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Pembayaran lewat Xendit (QRIS, Virtual Account, e-wallet) sedang disiapkan. Halaman ini
          akan menjadi form checkout Rp20.000.
        </p>
        <Link href="/" className="btn-ghost mt-5 w-full">
          Kembali ke beranda
        </Link>
      </div>
    </div>
  )
}
