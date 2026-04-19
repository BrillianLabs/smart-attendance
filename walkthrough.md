# SisAbsen — Walkthrough Aplikasi

Proyek web **SisAbsen** (Sistem Manajemen Kehadiran Sekolah) telah berhasil dibangun menggunakan **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS v4**, dan **Supabase**. Seluruh fitur utama dan arsitektur database sudah diimplementasikan sesuai kebutuhan Bapak/Ibu.

## 🗂️ Rangkuman Pekerjaan

Semua spesifikasi dan _requirement_ telah diimplementasikan:
1. **Sistem Autentikasi** menggunakan Supabase SSR (Email & Password).
2. **Dashboard Role-Based** untuk Admin dan Guru/Staf.
3. **Absensi Online via GPS** dengan kalkulasi `Haversine Distance` otomatis untuk mendeteksi apakah _user_ berada di area sekolah (radius dapat diatur oleh Admin).
4. **Sistem Pengajuan & Approval Izin** dengan catatan status.
5. **Dashboard Analitik Admin** dengan _chart_ kehadiran bulanan menggunakan library Recharts.
6. **Ekspor Data** berupa file `.csv` otomatis.
7. **Pengaturan Kustomisasi Sekolah** yang dinamis (Nama Sekolah, Logo di-upload ke Storage, Warna Tema CSS `inline`, titik koordinat sekolah, dan jam masuk/pulang).
8. **Arsitektur Face-Recognition Ready**, sebuah *placeholder* UI siap diintegrasikan dengan modul `face-api.js` (komputasi di sisi _client_ _browser_ tanpa biaya API third-party).

## 🚀 Panduan Setup & Uji Coba Lintas Platform

Proyek siap dijalankan di mesin Anda. Ikuti petunjuk singkat ini untuk setup database jika belum memiliki satu. Anda dapat membaca file [README.md](file:///c:/Users/DATA-PSDKP/Documents/Project/Project/javascript/Sis%20Smart/README.md) untuk instruksi mendetail, atau ini intisarinya:

### Langkah Setup Supabase

Aplikasi sangat *serverless-friendly* (koneksi API Client langsung ke Supabase API Gateway):

1. **Buat Database & Schema:** Buka akun Supabase (Free Tier cukup!). Masuk ke menu **SQL Editor**, buka *blank query*, dan letakkan seluruh isi dokumen [schema.sql](file:///c:/Users/DATA-PSDKP/Documents/Project/Project/javascript/Sis%20Smart/supabase/schema.sql), lalu jalankan (Run). File skema ini memuat semua table (`profiles`, `attendance`, `leave_requests`, `settings`), enum, RLS, hingga triggers otomatis dan fungsi. 
2.  **Masukkan Data Dummy:** Setelah sukses di _Run_ pertama, buka kembali SQL Editor baru dan jalankan juga file [seed.sql](file:///c:/Users/DATA-PSDKP/Documents/Project/Project/javascript/Sis%20Smart/supabase/seed.sql). *(Catatan: Tambahkan dulu Setidaknya 1 akun via Supabase dashboard / menu Authentication jika ingin mencoba update role menjadi admin untuk seed data SQL).*
3. **Konfigurasi API Keys:** Dari halaman setelan Supabase (`Settings > API`), salin **Project URL** dan **Anon Key**.
4. **Simpan ke Env Lokal:** Tambahkan URL dan Keys ini ke file [.env.local](file:///c:/Users/DATA-PSDKP/Documents/Project/Project/javascript/Sis%20Smart/.env.local) di root folder proyek Anda.
5. **Jalankan Aplikasi:** Buka console powershell dan ketik `npm run dev` pada direktori root proyek `c:\Users\DATA-PSDKP\Documents\Project\Project\javascript\Sis Smart` untuk mencoba langsung.

## 🖼️ Tampilan & Desain (UI/UX)
> [!TIP]
> Antarmuka (UI) menggunakan desain *mobile-first*, *clean*, dan modular. Cocok diakses baik di PC maupun dari layar perangkat genggam *(Smartphone)* oleh staf sekolah yang lalu-lalang di gerbang kehadiran. Warna Tema (Primary Color) pun menyesuaikan dengan setelan yang ada di tabel *settings*. 

### Navigasi Responsif
Terdapat komponen Navigasi modern:
- Pada komputer (Desktop/Laptop), pengguna melihat [Sidebar Kiri](file:///c:/Users/DATA-PSDKP/Documents/Project/Project/javascript/Sis%20Smart/src/components/layout/Sidebar.tsx).
- Pada Mobile, navigasi berubah optimal dengan Layout menu [Bottom Tab bar (MobileNav)](file:///c:/Users/DATA-PSDKP/Documents/Project/Project/javascript/Sis%20Smart/src/components/layout/MobileNav.tsx) untuk pergerakan dengan ibu jari (ergonomis) dan Header mini.

### Fitur Kunci: 📍 Dashboard Absensi Otomatis
File [AttendanceClient.tsx](file:///c:/Users/DATA-PSDKP/Documents/Project/Project/javascript/Sis%20Smart/src/components/attendance/AttendanceClient.tsx) menghandle sensor GPS bawaan perangkat.
* Pada modul ini, Tombol _Absen Masuk_ atau _Absen Pulang_ baru akan teraktifkan *apabila `geo.lat` & `geo.lng` berada dalam zona validasi jarak _spherical_ dari sekolah (100 meter secara *default*).*
* Menunjukkan animasi 'Ping' radar GPS apabila posisi tervalidasi di area sekolah.
* Melakukan validasi *Jam Masuk* otomatis ke Supabase Backend (seolah-olah `stored procedure / server action`) untuk mendata 'Hadir' vs 'Terlambat'.

### Keamanan: Role Level Security (RLS) & Route Proxy
Saya mengandalkan sistem keamanan terpadat Supabase.
* Pada PostgreSQL, data tabel dikunci oleh *policies* (RLS). Profil atau histori milik staf A tak bisa diakses oleh profil staf B. Namun, apabila perannya adalah `'admin'`, profil tersebut diberi hak kuasa penuh.
* Pada bagian Next.js, saya telah memastikan penulisan baru untuk Middleware (di Nextjs 16 adalah [proxy.ts](file:///c:/Users/DATA-PSDKP/Documents/Project/Project/javascript/Sis%20Smart/src/proxy.ts)). Jika staf secara acak mencoba URL `/admin/users`, sistem segera mendepak (tolak) lalu _redirect_ ke zona aman staf/dashboard, sementara request data yang tanpa Session segera digiring ke jendela Login.

---

Aplikasi ini sudah dipastikan lolos pengecekan kode TypeScript serta bebas galat kompilasi dari Production Build Next.JS.
Semua dokumentasi lengkap tentang cara menjalankan dan detail folder dapat ditemukan di `README.md`.
