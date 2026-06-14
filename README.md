# Kopi Senja Rewards — Prototype (Opsi A: Input Manual)

Prototype sistem poin reward untuk coffee shop, dibuat untuk demo ke client.
Pendekatan ini **tidak butuh integrasi API ke ESB POSLite** — kasir input
nominal transaksi secara manual setelah pembayaran selesai di POS.

## Fitur

**Member (web app, login dengan nomor HP)**
- Cek saldo poin & progres "stamp card" menuju reward berikutnya
- Lihat katalog reward & tukar poin (menghasilkan kode verifikasi)
- Riwayat transaksi

**Kasir / Admin**
- Input transaksi (nomor HP + nominal) → poin otomatis terhitung & masuk ke member
- Kelola data member (cari, daftarkan member baru)
- Kelola katalog reward (tambah, aktif/nonaktifkan)
- Verifikasi kode redeem saat member mengambil reward

## Aturan Poin (default)

- Konversi: **Rp10.000 = 1 poin** (dibulatkan ke bawah), bisa diubah di
  `lib/db.ts` (tabel `settings`, key `points_per_idr`)
- Contoh katalog reward (data dummy, bisa diedit lewat tab "Reward"):
  - Upsize Gratis — 15 poin
  - Free Americano (Reg) — 30 poin
  - Free Pastry — 50 poin
  - Diskon 20% Bill — 80 poin
  - Free Signature Drink — 120 poin

## Menjalankan secara lokal

Butuh Node.js 18+.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

- `/member` — portal pelanggan (data dummy: coba nomor HP `081234567890`)
- `/admin` — dashboard kasir/admin (tanpa login pada prototype ini —
  di production wajib ditambah autentikasi staf)

Database SQLite otomatis dibuat di `data/rewards.db` dengan data contoh
(5 member, 5 reward) saat pertama kali dijalankan.

## Alur Demo yang Disarankan

1. Buka `/admin` → tab **Input Transaksi** → masukkan nomor HP member
   contoh (`081234567890`) dan nominal (misal `35000`) → poin bertambah.
2. Buka `/member` di tab/browser lain → login dengan nomor HP yang sama →
   lihat saldo poin bertambah & progres stamp card.
3. Tukar salah satu reward yang sudah terjangkau → muncul kode verifikasi.
4. Kembali ke `/admin` → tab **Verifikasi Redeem** → masukkan kode →
   sistem menunjukkan detail penukaran.

## Catatan untuk Production / Proposal

Prototype ini sengaja dibuat ringan (SQLite, tanpa auth) untuk kebutuhan
demo. Untuk go-live, beberapa hal yang perlu disesuaikan:

1. **Database**: pindah dari SQLite ke PostgreSQL terkelola (misalnya
   Supabase, free tier cukup untuk 500–5.000 member). Schema sudah
   sederhana dan mudah dimigrasikan (`lib/db.ts`).
2. **Autentikasi**:
   - Member: OTP via WhatsApp/SMS untuk login (lebih aman daripada nomor
     HP saja).
   - Kasir/Admin: login staf dengan PIN/password, idealnya per-akun agar
     ada audit trail siapa yang input transaksi.
3. **Hosting**: Vercel (free tier) untuk frontend + Supabase untuk
   database — estimasi biaya Rp0 sampai member/transaksi melewati batas
   free tier.
4. **Anti-fraud redeem**: kode verifikasi saat ini hanya string acak.
   Tambahkan expiry (misal berlaku 1 hari) dan tandai kode sebagai
   "sudah dipakai" setelah diverifikasi kasir, agar tidak bisa dipakai
   berulang.
5. **Integrasi ESB POSLite (Opsi B, fase lanjutan)**: jika ESB
   menyediakan API/webhook atau fitur export laporan transaksi pada tier
   yang dipakai client, langkah input manual di tab "Input Transaksi"
   bisa digantikan/dilengkapi dengan proses otomatis — struktur API
   (`/api/transaction`) sudah didesain agar bisa dipanggil dari sumber
   mana pun (manual form, webhook, atau hasil parsing file export).

## Struktur Proyek

```
app/
  page.tsx                 # landing page
  member/page.tsx          # login/registrasi member
  member/dashboard/page.tsx# dashboard member
  admin/page.tsx            # dashboard kasir/admin
  api/
    member/route.ts         # GET profil+riwayat, POST registrasi
    transaction/route.ts     # POST catat transaksi & poin
    redeem/route.ts          # POST tukar reward
    rewards/route.ts         # GET/POST/PUT katalog reward
    admin/members/route.ts   # GET cari member, POST daftar member
    admin/verify/route.ts    # GET verifikasi kode redeem
components/
  StampCard.tsx              # elemen visual progres reward
lib/
  db.ts                      # setup SQLite + seed data dummy
```
