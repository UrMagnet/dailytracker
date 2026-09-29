# Daily Tracker

Aplikasi tracker harian (habit, counting day, workout, nutrisi, keuangan) yang dijual sebagai
produk SaaS: akses lifetime sekali bayar Rp20.000. Next.js + Supabase + Xendit.

## Menjalankan

```bash
npm install
cp .env.example .env   # isi kredensial Supabase
npm run dev            # http://localhost:3000
npm run build
```

## Routing

| Route | Akses | Isi |
| --- | --- | --- |
| `/` | Publik | Landing page — hero, 5 fitur, harga, FAQ, CTA. Static-generated untuk SEO. |
| `/checkout` | Publik | Checkout Xendit (masih placeholder — Tahap 5). |
| `/masuk` | Publik | Login magic link untuk user yang sudah beli. `noindex`. |
| `/dashboard` | Perlu login | Aplikasi tracker. Redirect ke `/masuk` kalau belum login. `noindex`. |
| `/api/lq45` | Internal | Proxy CORS untuk harga indeks LQ45 dari Yahoo Finance. |

Login memakai magic link dengan `shouldCreateUser: false` — akun hanya dibuat oleh webhook Xendit
setelah pembayaran terkonfirmasi, jadi form login tidak bisa dipakai untuk daftar sendiri.

## Fitur tracker

- **Dashboard** — ringkasan hari ini: progress task, counter, workout minggu ini, total kalori & makro.
- **Tasks** — checklist harian per kategori (collapsible), progress bar harian, sub-item per task.
  Task, sub-item, dan kategori bisa ditambah/edit/hapus dari UI.
- **Counter** — counting day generik dan bisa lebih dari satu. Tombol "Tandai hari ini selesai"
  hanya bisa sekali per tanggal (ketuk lagi untuk membatalkan), menampilkan hari ke-, streak,
  jumlah hari bolong, dan tanggal mulai.
- **Workout** — split mingguan tetap (Senin Push … Minggu Rest) dengan checkbox + catatan per hari
  dan selector fokus khusus hari Rabu. Pilihan Rabu dan catatan disimpan per minggu (key ISO week),
  jadi tidak mengubah jadwal default minggu berikutnya.
- **Nutrisi** — pilih bahan + gram + waktu makan, makro dihitung otomatis dari data per 100 g.
- **Finance** — transaksi pemasukan/pengeluaran per kategori, hutang beserta cicilan, dan portofolio
  investasi (BTC, LQ45, emas) dengan harga pasar terkini.
- **Riwayat** — ringkasan 7/14/30 hari terakhir; klik satu tanggal untuk melihat & mengedit data
  hari itu di semua tab.

## Struktur

```
app/
  layout.tsx                 # metadata global, font, script tema anti-flash
  page.tsx                   # landing page (server component)
  masuk/page.tsx             # login
  dashboard/page.tsx         # mount aplikasi tracker
  checkout/page.tsx          # placeholder checkout (Tahap 5)
  api/lq45/route.ts          # proxy harga LQ45
  sitemap.ts robots.ts globals.css
src/
  App.tsx                    # auth guard + shell (sidebar desktop / bottom nav mobile)
  lib/
    types.ts                 # tipe data
    seed.ts                  # data awal (task, counter, jadwal workout, database USDA)
    date.ts                  # helper tanggal lokal (YYYY-MM-DD) & ISO week
    derive.ts                # perhitungan progress, streak, makro
    supabase.ts              # client Supabase
    sync.ts                  # AppData <-> tabel Postgres (load + diff-based upsert/delete)
    store.tsx                # state global + auto-sync ke Supabase + tema
  components/
    Auth.tsx Dashboard.tsx TaskChecklist.tsx DayCounter.tsx WorkoutTracker.tsx
    NutritionTracker.tsx Finance*.tsx History.tsx ui.tsx
supabase/migrations/         # schema + Row Level Security
```

## Catatan data

- Semua data per-user di Postgres (Supabase), dibatasi Row Level Security: satu user hanya bisa
  membaca/menulis baris miliknya sendiri. Lihat `supabase/migrations/0001_init.sql`.
- Store menyimpan seluruh state sebagai satu objek `AppData` di memori; setiap perubahan di-diff
  terhadap snapshot sebelumnya dan hanya baris yang berubah yang dikirim ke database.
- Log harian disimpan per tanggal (`days["YYYY-MM-DD"]`), log workout per minggu (`weeks["YYYY-Www"]`),
  jadi riwayat tetap utuh dan checklist "reset" sendiri tiap hari baru.
- Tanggal dihitung memakai waktu lokal (bukan UTC) supaya tidak meleset satu hari.
- Tema light/dark disimpan di `localStorage` (`daily-tracker:theme`) dan diterapkan sebelum render
  pertama supaya tidak ada flash putih.
- Nilai gizi: USDA FoodData Central, per 100 g bahan matang.
