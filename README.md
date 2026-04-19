# SisAbsen — Sistem Manajemen Kehadiran Sekolah

Aplikasi absensi online untuk guru dan staf sekolah. Dibangun dengan Next.js 14 App Router, Supabase, dan Tailwind CSS.

## Fitur

- ✅ Login dengan email/password (Supabase Auth)
- ✅ Absensi dengan validasi GPS (Haversine formula)
- ✅ Status hadir/terlambat otomatis berdasarkan jam kerja
- ✅ Pengajuan & persetujuan izin (sakit, cuti, dinas)
- ✅ Dashboard user: status hari ini, riwayat, ringkasan
- ✅ Dashboard admin: rekap, chart bulanan, filter, export CSV
- ✅ Manajemen pengguna (tambah/edit/nonaktifkan)
- ✅ Kustomisasi sekolah: nama, logo, warna tema, koordinat GPS
- ✅ Placeholder face recognition (siap integrasi face-api.js)
- ✅ Desain responsif (mobile-first)

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd sis-smart
npm install
```

### 2. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) → Create new project
2. Catat **Project URL** dan **Anon Key** dari Settings > API

### 3. Setup Database & Seeding (Gaya Laravel)

Sistem ini didesain agar Anda tidak perlu susah payah *copy-paste* masuk ke *SQL Editor* Supabase. Cukup jalankan perintah CLI dari komputer saja.

1. **Kumpulkan Kunci (KEYS):** Pergi ke Supabase dasbor. Anda membutuhkan variabel ini untuk ditaruh di `.env.local` di *root project*:
   - `NEXT_PUBLIC_SUPABASE_URL`: Dari menu **Settings > API**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Dari menu **Settings > API**
   - `SUPABASE_SERVICE_ROLE_KEY`: Dari menu **Settings > API**
   - `DATABASE_URL`: Dari menu **Settings > Database → Connection string → URI**

   Buat file `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL="https://<id>.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
   SUPABASE_SERVICE_ROLE_KEY="eyJ..."
   DATABASE_URL="postgres://postgres.<id>:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
   ```

2. **Jalankan Migrasi:**
   Eksekusi pembuatan skema tabel seperti perintah `php artisan migrate` dengan:
   ```bash
   npm run migrate
   ```
   *(Seluruh tabel RLS, fungsi, trigger, dan skema SQL akan dikirim otomatis ke cloud).*

3. **Jalankan Seeder Ajaib (`php artisan db:seed`):**
   ```bash
   npm run seed
   ```
   > 🎉 **Viola!** Skrip ini akan secara ajaib mem-_bypass_ verifikasi email, membuatkan Anda **1 Kepala Sekolah** dan **2 Staf** secara otomatis, serta merajut ribuan data titik GPS, absensi 30 hari ke belakang, dan riwayat cuti secara aman tanpa _error querying schema_ terulang lagi.

### 5. Jalankan Development Server

```bash
npm run dev
```

Akses: `http://localhost:3000`

---

## Struktur Folder

```
src/
├── app/
│   ├── (auth)/login/          # Halaman login
│   ├── (dashboard)/
│   │   ├── page.tsx           # Dashboard user
│   │   ├── attendance/        # Absensi GPS
│   │   ├── leave/             # Izin
│   │   └── admin/             # Halaman admin
│   └── api/export/            # CSV export endpoint
├── components/
│   ├── ui/                    # Komponen primitif
│   ├── attendance/            # Komponen absensi
│   ├── leave/                 # Komponen izin
│   ├── admin/                 # Komponen admin
│   ├── layout/                # Sidebar, Navbar, MobileNav
│   └── face/                  # Face recognition placeholder
└── lib/
    ├── actions/               # Server Actions
    ├── hooks/                 # React hooks
    ├── supabase/              # Supabase clients
    ├── types/                 # TypeScript types
    └── utils/                 # Utilities
supabase/
    ├── schema.sql             # Skema database lengkap
    └── seed.sql               # Data contoh
```

---

## Deployment ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set environment variables di Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Menambahkan Face Recognition

Komponen `src/components/face/FaceCapture.tsx` sudah siap sebagai scaffold. Untuk mengaktifkan:

```bash
npm install face-api.js
```

Kemudian ikuti komentar TODO di dalam komponen tersebut.

---

## Konfigurasi di Admin

Setelah login sebagai admin, buka **Pengaturan** untuk:
1. Mengatur nama dan logo sekolah
2. Memasukkan koordinat GPS sekolah (dari Google Maps)
3. Mengatur radius absensi (default: 100 meter)
4. Mengatur jam masuk dan pulang
5. Memilih warna tema aplikasi
