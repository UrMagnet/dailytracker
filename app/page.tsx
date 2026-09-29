import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

const PRICE = 20000
const priceLabel = 'Rp20.000'

const FEATURES = [
  {
    name: 'Daily Task Checklist',
    tagline: 'Semua target harian dalam satu layar',
    description:
      'Susun task per kategori — kerja, belajar, konten, personal growth. Punya sub-item yang bisa dicentang satu per satu, plus progress bar harian supaya kelihatan berapa persen hari ini sudah kamu tuntaskan.',
    icon: IconCheck,
  },
  {
    name: 'Counting Day',
    tagline: 'Hitung hari, jaga streak',
    description:
      'Untuk kebiasaan yang butuh konsistensi jangka panjang. Lihat kamu sudah di hari ke berapa, berapa hari streak berturut-turut, dan berapa hari yang bolong sejak mulai.',
    icon: IconFlame,
  },
  {
    name: 'Workout Tracker',
    tagline: 'Split latihan mingguan',
    description:
      'Jadwal push/pull/leg per hari dengan catatan beban, rep, dan durasi. Hari fleksibel bisa diganti fokusnya tanpa mengubah jadwal default minggu berikutnya.',
    icon: IconDumbbell,
  },
  {
    name: 'Nutrition Tracker',
    tagline: 'Kalori & makro per gram',
    description:
      'Catat makanan per slot — sarapan, makan siang, makan malam, snack. Kalori, protein, karbo, dan lemak dihitung otomatis dari berat porsi yang kamu masukkan.',
    icon: IconApple,
  },
  {
    name: 'Finance Tracker',
    tagline: 'Pemasukan, hutang, dan investasi',
    description:
      'Catat pemasukan dan pengeluaran per kategori, pantau sisa hutang beserta cicilannya, dan lacak portofolio investasi (BTC, LQ45, emas) dengan harga pasar terkini.',
    icon: IconWallet,
  },
]

const FAQ = [
  {
    q: 'Ini bayar bulanan atau sekali saja?',
    a: `Sekali saja ${priceLabel}. Tidak ada tagihan bulanan, tidak ada perpanjangan otomatis. Sekali bayar, aksesnya selamanya.`,
  },
  {
    q: 'Datanya bisa diakses dari HP dan laptop?',
    a: 'Bisa. Data tersimpan di cloud dan terikat ke akunmu, jadi tinggal login dari perangkat mana pun — HP, tablet, atau laptop — dan datanya tetap sama.',
  },
  {
    q: 'Metode pembayaran apa saja yang diterima?',
    a: 'QRIS, Virtual Account semua bank besar, dan e-wallet seperti OVO, DANA, dan ShopeePay. Pembayaran diproses lewat Xendit.',
  },
  {
    q: 'Setelah bayar, bagaimana cara masuk?',
    a: 'Akunmu dibuat otomatis begitu pembayaran terkonfirmasi, dan link akses langsung dikirim ke emailmu. Untuk login berikutnya, cukup masukkan email dan kami kirimkan link masuk — tidak perlu hafal password.',
  },
  {
    q: 'Apakah data keuangan saya aman?',
    a: 'Setiap akun hanya bisa membaca datanya sendiri — dibatasi langsung di level database, bukan cuma di aplikasi. Kami juga tidak pernah menyimpan data kartu atau rekeningmu; seluruh proses pembayaran ditangani Xendit.',
  },
]

export default function LandingPage() {
  return (
    <>
      <StructuredData />
      <div className="min-h-dvh">
        <Header />
        <main>
          <Hero />
          <Features />
          <Pricing />
          <Faq />
        </main>
        <Footer />
      </div>
    </>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-neutral-50/85 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/85">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 lg:px-8">
        <span className="text-sm font-semibold tracking-tight">✅ Daily Tracker</span>
        <nav className="flex items-center gap-1.5">
          <Link href="#fitur" className="btn-ghost hidden px-3 py-1.5 text-xs sm:inline-flex">
            Fitur
          </Link>
          <Link href="#harga" className="btn-ghost hidden px-3 py-1.5 text-xs sm:inline-flex">
            Harga
          </Link>
          <Link href="/masuk" className="btn-ghost px-3 py-1.5 text-xs">
            Masuk
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-4 pt-14 lg:px-8 lg:pt-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="chip bg-indigo-600/10 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
          Sekali bayar · Akses selamanya
        </span>
        <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight lg:text-6xl">
          Semua progres harianmu, dalam{' '}
          <span className="bg-[image:var(--gradient-accent)] bg-clip-text text-transparent">
            satu aplikasi
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-neutral-600 lg:text-lg dark:text-neutral-400">
          Habit harian, counting day, workout, nutrisi, dan keuangan — berhenti loncat antar lima
          aplikasi berbeda. Lacak semuanya di satu tempat, sekali bayar {priceLabel}.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/checkout" className="btn-primary w-full px-6 py-3 text-base sm:w-auto">
            Berlangganan Sekarang — {priceLabel}
          </Link>
          <Link href="#fitur" className="btn-ghost w-full px-6 py-3 text-base sm:w-auto">
            Lihat fiturnya
          </Link>
        </div>
        <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-500">
          Tanpa langganan bulanan · Bayar via QRIS, VA, atau e-wallet
        </p>
      </div>

      <div className="mt-14 grid gap-3 sm:grid-cols-3">
        <Stat value="5" label="tracker dalam satu app" />
        <Stat value={priceLabel} label="sekali bayar, bukan per bulan" />
        <Stat value="∞" label="akses seumur hidup" />
      </div>
    </section>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card text-center">
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
    </div>
  )
}

function Features() {
  return (
    <section id="fitur" className="mx-auto max-w-5xl scroll-mt-16 px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">Lima tracker, satu login</h2>
        <p className="mt-3 text-pretty text-neutral-600 dark:text-neutral-400">
          Setiap bagian dirancang untuk dipakai harian — cepat dicatat, gampang dilihat progresnya.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {FEATURES.map((f, i) => (
          <div
            key={f.name}
            className={`card ${i === FEATURES.length - 1 && FEATURES.length % 2 === 1 ? 'md:col-span-2' : ''}`}
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                <f.icon />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold leading-tight">{f.name}</h3>
                <p className="mt-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {f.tagline}
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {f.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Pricing() {
  const included = [
    'Kelima tracker, tanpa fitur yang dikunci',
    'Data tersinkron di semua perangkat',
    'Riwayat harian tanpa batas waktu',
    'Update fitur berikutnya, gratis',
    'Tanpa iklan, tanpa tagihan bulanan',
  ]

  return (
    <section id="harga" className="mx-auto max-w-5xl scroll-mt-16 px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">Satu harga, semua fitur</h2>
        <p className="mt-3 text-pretty text-neutral-600 dark:text-neutral-400">
          Tidak ada paket Basic atau Pro. Semua orang dapat aplikasi yang sama, utuh.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-md">
        <div className="card-accent">
          <div className="text-sm font-medium text-white/80">Akses Lifetime</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-semibold tracking-tight">{priceLabel}</span>
            <span className="text-sm text-white/70">sekali bayar</span>
          </div>
          <p className="mt-2 text-sm text-white/80">
            Bayar sekali hari ini, pakai selamanya. Tidak ada perpanjangan.
          </p>

          <ul className="mt-6 space-y-2.5">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/checkout"
            className="mt-7 flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-white/90 active:scale-[0.99]"
          >
            Berlangganan Sekarang
          </Link>
          <p className="mt-3 text-center text-xs text-white/70">
            QRIS · Virtual Account · OVO, DANA, ShopeePay
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Sudah pernah beli?{' '}
          <Link href="/masuk" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Masuk di sini
          </Link>
        </p>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-24">
      <h2 className="text-center text-3xl font-semibold tracking-tight lg:text-4xl">
        Pertanyaan yang sering ditanya
      </h2>
      <div className="mt-8 space-y-3">
        {FAQ.map((item) => (
          <details key={item.q} className="card group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {item.q}
              <span className="shrink-0 text-neutral-400 transition group-open:rotate-45">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="card mt-10 text-center">
        <h3 className="text-xl font-semibold tracking-tight">Siap mulai hari ini?</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
          Sekali bayar {priceLabel}, langsung dapat akses ke kelima tracker — selamanya.
        </p>
        <Link href="/checkout" className="btn-primary mt-5 px-6 py-3 text-base">
          Berlangganan Sekarang
        </Link>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-neutral-200 py-8 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-xs text-neutral-500 sm:flex-row lg:px-8 dark:text-neutral-500">
        <span>© {new Date().getFullYear()} Daily Tracker</span>
        <Link href="/masuk" className="hover:text-neutral-800 dark:hover:text-neutral-300">
          Masuk ke akun
        </Link>
      </div>
    </footer>
  )
}

/** schema.org Product markup so search engines can show price/availability. */
function StructuredData() {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Daily Tracker',
    description:
      'Aplikasi web untuk melacak kebiasaan harian, counting day, workout, nutrisi, dan keuangan (hutang & investasi) dalam satu tempat.',
    brand: { '@type': 'Brand', name: 'Daily Tracker' },
    offers: {
      '@type': 'Offer',
      price: PRICE,
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/checkout`,
    },
    mainEntity: {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
}

// ---- Icons (shared visual language with the dashboard) -------------------

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h10M4 12h10M4 18h7" strokeLinecap="round" />
      <path d="M16.5 16.5l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconFlame() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3s5 4 5 9a5 5 0 01-10 0c0-2 1-3 1-3s.5 2 2 2c0-4 2-8 2-8z" strokeLinejoin="round" />
    </svg>
  )
}
function IconDumbbell() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" strokeLinecap="round" />
    </svg>
  )
}
function IconApple() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 8c-3-2-8 0-8 5s4 8 5.5 8S11 20 12 20s1.5 1 2.5 1S20 18 20 13s-5-7-8-5z" strokeLinejoin="round" />
      <path d="M12 8V5m0 0c0-1 1-2 2.5-2" strokeLinecap="round" />
    </svg>
  )
}
function IconWallet() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" strokeLinecap="round" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
