# 🛠️ Dokumentasi Teknis (e-Absensi)

Dokumen ini menjelaskan arsitektur teknis dan mekanisme keamanan yang digunakan dalam sistem e-Absensi.

## 1. Autentikasi & Otorisasi
- **Provider**: Supabase Auth (GoTrue).
- **Middleware**: `src/proxy.ts` menangani refresh token dan proteksi rute di sisi server (Server-side rendering protection).
- **RLS (Row Level Security)**: Data presensi dan profil diproteksi di level database berdasarkan UUID user.

## 2. Verifikasi Wajah (Face Recognition)
- **Library**: `face-api.js` (berbasis TensorFlow.js).
- **Mekanisme**:
  - Model dimuat dari `/public/models`.
  - Deteksi wajah dilakukan di sisi klien (browser) untuk menghindari beban server yang tinggi.
  - Saat presensi, sistem melakukan *Descriptor Matching* untuk memastikan wajah yang tertangkap kamera sesuai dengan data terdaftar.

## 3. Deteksi GPS & Anti-Spoofing
- **Library**: `@dhamaddam/anti-fake-gps`.
- **Fitur**:
  - Mendeteksi penggunaan aplikasi "Mock Location" di Android/iOS.
  - Mendeteksi penggunaan proxy atau VPN yang mencurigakan ( heuristics).
  - Melakukan pengecekan radius (haversine formula) antara koordinat user dan koordinat sekolah yang tersimpan di database.

## 4. Optimasi Performa (Aesthetics & Speed)
- **Gambar**: Semua aset menggunakan format **WebP** dengan kompresi tingkat tinggi.
- **Font**: Menggunakan `next/font/local` untuk memuat Material Symbols tanpa render-blocking dari CDN eksternal.
- **Caching**: Menggunakan `unstable_cache` pada data pengaturan sekolah yang jarang berubah untuk meminimalkan beban database.

## 5. Pengembangan Lokal
- **Database**: PostgreSQL (Supabase).
- **Scripts**:
  - `npm run db:fresh`: Menghapus dan menyinkronkan ulang database dengan data demo terbaru.
  - `npm run build`: Melakukan kompilasi produksi dengan bundle analyzer terintegrasi.

---
© 2026 **e-Absensi Engineering Team**.
