# 📖 Panduan Penggunaan (Usage Guide)

Sistem ini dirancang untuk memberikan kemudahan dalam manajemen kehadiran. Berikut adalah panduan singkat penggunaan fitur-fitur utama:

### 1. Peran Pengguna (User Roles)
*   **Administrator**: Memiliki kendali penuh atas sistem, manajemen pengguna, pengaturan lokasi sekolah (Geofencing), dan akses ke seluruh laporan kehadiran.
*   **Staff/Guru**: Pengguna yang melakukan presensi harian, melihat riwayat kehadiran pribadi, dan mengajukan izin.

### 2. Alur Presensi (Attendance Flow)
Fitur ini menggunakan verifikasi **GPS Geofencing** untuk memastikan kehadiran dilakukan di lokasi yang telah ditentukan.

*   **Check-In (Masuk)**: 
    1. Buka menu **Attendance**.
    2. Izinkan akses lokasi pada browser/perangkat Anda.
    3. Pastikan indikator lokasi menunjukkan status "Inside School Radius".
    4. Klik tombol **Check In**.
*   **Check-Out (Pulang)**: 
    1. Kembali ke menu **Attendance** di jam pulang.
    2. Klik tombol **Check Out** untuk mencatat waktu pulang.
*   **Status Kehadiran**: 
    - **Hadir**: Tepat waktu.
    - **Terlambat**: Masuk setelah jam yang ditentukan di Settings.
    - **Izin/Sakit**: Kehadiran yang tercatat melalui pengajuan form izin.

### 3. Pengajuan Izin & Cuti (Leave Management)
*   Buka menu **Leave** > **Request Leave**.
*   Pilih kategori (Sakit, Izin, Cuti, atau Dinas).
*   Pilih rentang tanggal dan berikan alasan yang jelas.
*   Pantau status pengajuan Anda di halaman riwayat izin.

### 4. Fitur Khusus Administrator
*   **Dashboard Analytics**: Memantau statistik kehadiran harian (Hadir, Telat, Izin, Alpha) secara real-time melalui Bento Grid metrics.
*   **Manajemen User**: Menambah, mengedit, atau menonaktifkan akun Staff melalui menu **Admin > Users**.
*   **Settings (Geofencing)**: 
    - Mengatur titik koordinat sekolah (Latitude/Longitude).
    - Menentukan radius aman (misal: 100 meter).
    - Mengatur jam kerja (Mulai & Selesai).
*   **Approval Izin**: Verifikasi dan setujui/tolak pengajuan izin staff melalui menu **Admin > Leave**.
*   **Ekspor Rekap**: Download laporan kehadiran bulanan dalam format **CSV** untuk keperluan administrasi.

### 5. Tip Penggunaan UI
*   **Bento Grid**: Gunakan navigasi sidebar yang intuitif untuk berpindah antara dashboard dan modul lainnya.
*   **Mobile First**: Aplikasi ini sangat optimal digunakan melalui smartphone untuk memudahkan presensi di lapangan.
