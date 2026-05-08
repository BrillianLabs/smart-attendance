-- ================================================
-- SisAbsen - Automagic Seed Data
-- ================================================
-- Jalankan HANYA SETELAH schema.sql sukses dieksekusi.
-- Script ini akan membuat otomatis User Auth, Profil, Pengaturan, 
-- Histori Absensi 30 hari, dan Data Izin.

-- Pastikan extension pgcrypto aktif untuk password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Setup Data Sekolah (Pengaturan)
UPDATE settings SET
  school_name      = 'NAMA SEKOLAH',
  primary_color    = '#006a61',
  school_lat       = -6.2088,
  school_lng       = 106.8456,
  allowed_radius_m = 100,
  work_start_time  = '07:30',
  work_end_time    = '15:00',
  updated_at       = NOW()
WHERE id = 1;

-- ==========================================================
-- 2. Generate Dummy Data (Absen & Izin) untuk User Eksisting
-- ==========================================================
-- Skrip ini akan secara otomatis mencari profil yang sudah Anda
-- buat secara manual di menu "Authentication" dasbor Supabase,
-- lalu membuatkan histori absen 30 hari ke belakang.

DO $$
DECLARE
  rec RECORD;
  leave_count INT := 0;
BEGIN

  -- Bersihkan histori lama agar bersih saat di-run ulang
  DELETE FROM attendance;
  DELETE FROM leave_requests;

  -- -----------------------------------------
  -- LOOP SEMUA PROFIL STAFF UNTUK DIBUATKAN ABSEN
  -- -----------------------------------------
  FOR rec IN SELECT id, full_name, role FROM profiles WHERE role = 'staff' LOOP
    
    -- Update nama jabatan agar realistis
    UPDATE profiles SET position = 'Guru / Staf Akademik' WHERE id = rec.id;

    -- Bikin 30 histori absensi (dengan bolong di akhir pekan)
    INSERT INTO attendance (user_id, date, check_in, check_out, status, check_in_lat, check_in_lng)
    SELECT
      rec.id,
      CURRENT_DATE - (gs.day || ' days')::INTERVAL,
      (CURRENT_DATE - (gs.day || ' days')::INTERVAL)::TIMESTAMP + INTERVAL '7 hours 25 minutes',
      (CURRENT_DATE - (gs.day || ' days')::INTERVAL)::TIMESTAMP + INTERVAL '15 hours 5 minutes',
      CASE WHEN RANDOM() > 0.1 THEN 'hadir' ELSE 'telat' END::attendance_status,
      -6.2088 + (RANDOM() - 0.5) * 0.001,
      106.8456 + (RANDOM() - 0.5) * 0.001
    FROM 
      generate_series(1, 30) AS gs(day)
    WHERE 
      EXTRACT(DOW FROM CURRENT_DATE - (gs.day || ' days')::INTERVAL) NOT IN (0, 6);

    -- -----------------------------------------
    -- BIKIN 1 CONTOH IZIN PER STAFF
    -- -----------------------------------------
    IF leave_count = 0 THEN
      INSERT INTO leave_requests (user_id, start_date, end_date, leave_type, reason, status)
      VALUES (rec.id, CURRENT_DATE + 2, CURRENT_DATE + 3, 'sakit', 'Demam tinggi dan perlu istirahat dari dokter', 'pending');
      leave_count := 1;
    ELSE
      INSERT INTO leave_requests (user_id, start_date, end_date, leave_type, reason, status)
      VALUES (rec.id, CURRENT_DATE - 5, CURRENT_DATE - 5, 'izin', 'Mengurus dokumen keluarga', 'approved');
      leave_count := 0;
    END IF;

  END LOOP;

  -- -----------------------------------------
  -- UPDATE JABATAN ADMIN
  -- -----------------------------------------
  UPDATE profiles SET position = 'Kepala Sekolah / Admin' WHERE role = 'admin';

END $$;
