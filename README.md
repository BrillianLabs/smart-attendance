# 🏛️ Atelier Academy — Management System

Atelier Academy adalah sistem manajemen kehadiran dan operasional institusi akademik modern yang dirancang dengan estetika premium dan fungsionalitas tinggi. Menggunakan filosofi desain **"No-Line"** dan layout **Bento Grid**, sistem ini memberikan pengalaman pengguna yang intuitif sekaligus mewah.

## ✨ Fitur Utama (Highlight)
- **🎨 Premium UI System**: Selaras dengan identitas visual *Atelier Academy* (Sea-Glass palette).
- **📍 GPS Verified Attendance**: Presensi digital berbasis lokasi dengan radius aman yang dapat dikonfigurasi.
- **📊 Academy Analytics**: Dashboard informatif untuk Admin dengan visualisasi data *real-time*.
- **📩 Leave & Request Journey**: Sistem pengajuan izin atau cuti yang terintegrasi dengan alur verifikasi admin.
- **🔐 Portal Khusus**: Area kerja terpisah untuk Administrator dan Staf/Guru.

## 🚀 Teknologi
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (Custom Tonal Configuration)
- **Database**: Supabase / PostgreSQL (dengan Row Level Security)
- **Icons**: Material Symbols Outlined (High Fidelity)

## 🔑 Akun Demo (Default)

Gunakan akun berikut untuk menguji coba fitur dalam lingkungan pengembangan:

| Role | Email | Password | Jabatan |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@sekolah.sch.id` | `User123!` | Kepala Sekolah / Admin |
| **Staff/Guru** | `budi@sekolah.sch.id` | `User123!` | Guru Matematika |
| **Staff/Guru** | `siti@sekolah.sch.id` | `User123!` | Guru B. Indonesia |

> [!IMPORTANT]
> **Catatan Keamanan**: Harap segera ubah kata sandi default atau perbarui konfigurasi akun melalui menu *User Management* setelah melakukan instalasi awal.

## 🛠️ Instalasi & Pengembangan

1. **Instal Dependensi**:
   ```bash
   npm install
   ```

2. **Konfigurasi Environment**:
   Pastikan sudah mengatur file `.env.local` dengan kredensial Supabase Anda.

3. **Database Setup**:
   Jalankan perintah berikut untuk menyinkronkan skema dan menyuntikkan data *seed* (Atelier Academy branding):
   ```bash
   npm run db:fresh
   ```

4. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```

---
© 2026 **Atelier Academy**. Designed for Academic Excellence.
