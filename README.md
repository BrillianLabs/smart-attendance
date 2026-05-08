# 🏛️ e-Absensi — Premium Attendance System

e-Absensi adalah sistem manajemen kehadiran modern yang dirancang dengan estetika premium dan fungsionalitas tinggi. Menggunakan filosofi desain **"No-Line"** dan layout **Bento Grid**, sistem ini memberikan pengalaman pengguna yang intuitif, cepat, dan aman.

## ✨ Fitur Utama (Highlight)
- **🎨 Premium UI System**: Antarmuka modern dengan Glassmorphism dan desain responsif (Mobile First).
- **📸 Face Recognition Verification**: Verifikasi presensi berbasis AI Face Detection untuk menjamin kehadiran fisik.
- **📍 Anti-Fake GPS & Geofencing**: Proteksi terhadap lokasi palsu (spoofing) dan pembatasan radius kehadiran.
- **🚀 Ultra-Fast Performance**: Aset gambar WebP, font lokal, dan kueri teroptimasi untuk kecepatan maksimal.
- **📊 SD NEGERI NGUWOK Analytics**: Dashboard informatif untuk Admin dengan visualisasi data real-time.
- **📩 Leave Journey**: Alur pengajuan izin dan cuti yang seamlessly terintegrasi.

## 🚀 Arsitektur Multi-Sekolah (SaaS-like)
Project ini menggunakan arsitektur *Satu Core Banyak Cabang* untuk memudahkan manajemen banyak sekolah:
- **Git Strategy**: Branch `main` bertindak sebagai *core template*. Setiap sekolah menggunakan branch mereka sendiri (contoh: `smart-attendance` untuk SD Nguwok) yang akan menerima pembaruan dari `main`.
- **Database Terisolasi**: Setiap sekolah menggunakan project Supabase yang terpisah.
- **Dynamic Branding**: Nama dan sub-judul aplikasi dikendalikan sepenuhnya lewat Environment Variables di Netlify, tanpa mengubah kode sama sekali.

## 🛠️ Teknologi
- **Framework**: Next.js 16 (App Router)
- **AI/ML**: `face-api.js` (TensorFlow.js)
- **Perlindungan**: `@dhamaddam/anti-fake-gps`
- **Styling**: Tailwind CSS v4 (Custom Tonal Configuration)
- **Database**: Supabase / PostgreSQL (1 project per sekolah)
- **Icons**: Material Symbols Outlined (Self-hosted)

## 🔑 Akun Demo (Default)

Gunakan akun berikut untuk menguji coba fitur dalam lingkungan pengembangan:

| Role | Email | Password | Jabatan |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@sekolah.sch.id` | `User123!` | Kepala Sekolah / Admin |
| **Staff/Guru** | `budi@sekolah.sch.id` | `User123!` | Guru Matematika |

> [!IMPORTANT]
> **Catatan Keamanan**: Harap segera ubah kata sandi default atau perbarui konfigurasi akun melalui menu *User Management* setelah melakukan instalasi awal.

## 🛠️ Instalasi & Pengembangan

1. **Instal Dependensi**:
   ```bash
   npm install
   ```

2. **Konfigurasi Environment**:
   Pastikan sudah mengatur file `.env.local` dengan kredensial Supabase sekolah. Variabel baru:
   ```env
   NEXT_PUBLIC_APP_NAME=SIGAP Nguwok
   NEXT_PUBLIC_APP_SUBTITLE=Sistem Informasi Guru Absensi Pintar
   ```

3. **Database Setup**:
   Jalankan perintah berikut untuk migrasi skema dan data (Hanya untuk instalasi baru):
   ```bash
   npm run db:fresh
   ```
   *Catatan: Untuk pembaruan pada sekolah yang sudah berjalan, gunakan migrasi inkremental:*
   ```bash
   npm run migrate:run supabase/migrations/nama_file.sql
   ```

4. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```

## 🌐 Deployment (Netlify)

Proyek ini telah dikonfigurasi untuk dideploy ke Netlify (Site Name: `brillian-sis-smart`).

### Konfigurasi Penting:
- **Middleware**: Menggunakan `src/proxy.ts` (Next.js 16) untuk menangani autentikasi.
- **Aset**: Gambar dioptimalkan otomatis via `next/image` dan hosting WebP lokal.

## 📖 Panduan Penggunaan (Usage Guide)

Untuk panduan lengkap mengenai cara penggunaan aplikasi, silakan baca:
👉 **[PANDUAN PENGGUNAAN (USAGE.md)](./USAGE.md)**

---
### ✅ Update Terakhir:
- **Branding**: Selesai migrasi ke e-Absensi.
- **Performance**: Optimasi aset 8.6MB menjadi 17KB dan self-hosting fonts.
- **Security**: Integrasi deteksi GPS palsu dan Face Recognition.
- **UI/UX**: Perbaikan responsivitas Dashboard Admin dan navigasi mobile.

---
© 2026 **e-Absensi**. Designed for Excellence.
