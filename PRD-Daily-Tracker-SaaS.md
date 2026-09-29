PRD — Daily Tracker SaaS
Versi: 1.0

Tanggal: 13 Agustus 2026

Status: Draft untuk eksekusi

1. Latar Belakang
Daily Tracker saat ini adalah aplikasi personal (React + Vite + Tailwind, data tersimpan di localStorage) untuk melacak beberapa hal harian: daily task checklist, counting day, workout tracker, nutrition tracker, dan finance tracker (hutang, investasi, serta tracking keuangan lainnya). Aplikasi ini akan diubah menjadi produk SaaS yang bisa dijual ke publik, lengkap dengan landing page untuk marketing/konversi dan payment page untuk transaksi.
2. Tujuan Produk
·	Mengubah tool personal menjadi produk yang bisa di-monetisasi.
·	Menjual akses lifetime ke aplikasi dengan strategi harga rendah, volume tinggi (Rp20.000).
·	Fokus ke pasar lokal Indonesia terlebih dahulu; ekspansi ke pasar global dipertimbangkan di tahap selanjutnya (lihat Section 11 — Roadmap Selanjutnya).
Success Metrics (indikatif, bisa disesuaikan setelah launch)
·	Conversion rate landing page → checkout ≥ 2-3%.
·	Conversion rate checkout → payment sukses ≥ 70%.
·	Jumlah unit terjual per bulan sebagai indikator utama (karena model volume play).
·	Landing page terindeks & muncul di Google search untuk keyword terkait ("daily tracker app", "habit tracker Indonesia", dst).
3. Target Pengguna
·	Individu di Indonesia yang ingin melacak kebiasaan harian, progres jangka panjang (counting day), workout, nutrisi, dan keuangan (hutang, investasi) dalam satu aplikasi.
·	Karakteristik: sensitif harga, terbiasa pembayaran via QRIS/e-wallet/transfer bank.
4. Model Bisnis
Aspek	Keputusan
Model monetisasi	One-time purchase, lifetime access
Harga	Rp20.000
Struktur paket	Single tier — semua fitur dalam satu paket, tidak ada tingkatan Basic/Pro
Target pasar	Indonesia (lokal) — ekspansi global dipertimbangkan nanti
Payment gateway	Xendit (QRIS, Virtual Account, e-wallet)

5. Lingkup Produk (Scope)
5.1 In Scope — MVP
A. Landing Page
·	Hero section dengan value proposition jelas dalam 5 detik pertama.
·	Showcase fitur utama (5 tracker) dengan screenshot/mockup.
·	Social proof (testimoni — bisa placeholder di awal, atau kosong dulu kalau belum ada data).
·	Bagian harga & CTA "Beli Sekarang" — harga tunggal Rp20.000, tanpa perlu logic multi-currency.
·	Dibangun dengan pendekatan SEO-friendly (server-rendered), karena traffic ditargetkan dari organic search DAN ads/sosmed.
·	Konten & copywriting full Bahasa Indonesia.
B. Payment Page / Checkout
·	Form checkout minimal (email + metode pembayaran) — hindari friction, karena harga rendah = keputusan cepat.
·	Integrasi Xendit: invoice/checkout page yang support QRIS, Virtual Account, dan e-wallet lokal (OVO, DANA, ShopeePay, dll).
·	Setelah pembayaran sukses → otomatis membuat akun user & kirim email akses (magic link atau kredensial).
·	Webhook handler untuk konfirmasi status pembayaran dari Xendit (unlock akun otomatis, tanpa perlu verifikasi manual).
C. Autentikasi & Akun
·	Sistem auth (email + password, atau magic link) — dibutuhkan karena app sekarang harus multi-tenant (banyak user, bukan cuma localStorage).
·	Setiap akun hanya bisa diakses setelah pembayaran terverifikasi.
D. Aplikasi Tracker (migrasi dari versi personal)
·	Daily Task Checklist
·	Counting Day Tracker
·	Workout Tracker
·	Nutrition Tracker
·	Finance Tracker (hutang, investasi, dan tracking keuangan lainnya)
·	Data pindah dari localStorage ke database cloud (per-user), supaya bisa diakses lintas device.
5.2 Out of Scope (untuk versi awal)
·	Sistem subscription/recurring billing (karena model lifetime one-time).
·	Multi-tier pricing (Basic vs Pro).
·	Fitur kolaborasi/sharing antar user.
·	Aplikasi mobile native (fokus web responsive dulu).
·	Refund automation (proses refund manual di awal, evaluasi kebutuhan otomasi setelah ada volume).
6. Arsitektur & Tech Stack (Rekomendasi)
Layer	Rekomendasi	Alasan
Landing page	Next.js (SSR/SSG)	SEO-friendly, cepat, bisa serve konten ke crawler tanpa perlu JS render di client
Aplikasi tracker (dashboard)	React (bisa lanjut pakai basis Vite yang sudah ada, atau disatukan ke Next.js sebagai satu codebase)	Migrasi lebih cepat dari versi personal yang sudah ada
Backend & Database	Supabase (Postgres + Auth + Storage)	Auth, database, dan storage jadi satu platform, free tier cukup besar untuk tahap awal, gampang scale
Payment	Xendit (Invoice API)	Mendukung metode pembayaran lokal Indonesia (QRIS, VA, e-wallet) dalam satu integrasi
Hosting	Vercel (untuk Next.js) + Supabase Cloud	Deploy cepat, cocok untuk tim kecil/solo founder

7. Alur Pengguna (User Flow)
1.	Visitor mendarat di landing page (dari organic search, ads, atau sosmed).
2.	Membaca value proposition, scroll ke bagian harga.
3.	Klik "Beli Sekarang" → diarahkan ke payment page.
4.	Isi email → pilih metode pembayaran (QRIS/kartu/e-wallet via Xendit).
5.	Menyelesaikan pembayaran di halaman Xendit.
6.	Xendit mengirim webhook konfirmasi ke sistem → sistem otomatis:
o	Membuat akun user (via Supabase Auth) terhubung ke email tersebut.
o	Mengirim email berisi link akses/set password.
7.	User login → masuk ke dashboard tracker (5 fitur: daily task, counting day, workout, nutrisi, finance).
8.	Akses bersifat lifetime — tidak ada billing berikutnya.
8. Requirement Non-Fungsional
·	Keamanan: data pembayaran tidak disimpan di sistem sendiri (delegasikan sepenuhnya ke Xendit sebagai PCI-compliant provider). Webhook harus diverifikasi signature-nya untuk mencegah spoofing.
·	Performa: landing page harus load cepat (target < 2 detik) mengingat harga rendah butuh konversi instan, tidak boleh ada friksi loading.
·	SEO: metadata, structured data (schema.org Product), sitemap, dan performa Core Web Vitals perlu diperhatikan sejak awal.
·	Skalabilitas biaya: karena model volume-play dengan harga rendah, biaya infrastruktur (hosting, database, payment fee) harus tetap proporsional kecil per transaksi.
9. Risiko & Hal yang Perlu Divalidasi
Risiko	Catatan
Fee payment gateway mengikis margin di harga Rp20.000	Perlu cek struktur fee Xendit aktual (persentase + fee tetap) sebelum finalisasi harga
Data finansial (hutang, investasi) lebih sensitif dibanding data tracker lain	Pertimbangkan proteksi tambahan (enkripsi field sensitif, row-level security di Supabase) — perlu diputuskan sebelum development dimulai
Model lifetime tanpa recurring revenue	Pertimbangkan roadmap upsell produk lain di masa depan untuk sustain revenue jangka panjang
Refund manual di awal	Perlu SOP sederhana untuk handling refund sebelum volume transaksi naik

10. Next Steps (Eksekusi)
1.	Setup akun Xendit (verifikasi bisnis, ambil API key sandbox untuk testing).
2.	Setup project Supabase (schema database untuk users, purchases, dan data per tracker).
3.	Build landing page (Next.js) — desain, copywriting Bahasa Indonesia, harga tunggal Rp20.000.
4.	Build payment flow — integrasi Xendit Invoice API + webhook handler.
5.	Migrasi aplikasi tracker dari localStorage-based ke database-based (per-user).
6.	Testing end-to-end: dari landing page → checkout → pembayaran sandbox → akses dashboard.
7.	Soft launch untuk validasi funnel sebelum scale ke ads.
11. Roadmap Selanjutnya (Belum Dieksekusi)
·	Ekspansi ke pasar global: menambahkan payment gateway internasional (Stripe/Xendit kartu kredit), multi-currency display (IDR/USD), dan copywriting landing page versi Inggris. Dipertimbangkan setelah traksi di pasar lokal tervalidasi.

Dokumen ini adalah starting point. Detail teknis (skema database, wireframe UI, copy landing page) akan dikembangkan di tahap eksekusi berikutnya.
