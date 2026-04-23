-- ================================================
-- SisAbsen - Supabase Schema
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- CLEAN RESET: Jalankan bagian ini jika ingin hapus SEMUA DATA (Hapus tanda --)
-- ================================================
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS attendance_photos CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS leave_status CASCADE;
DROP TYPE IF EXISTS leave_type CASCADE;

-- ========================
-- ENUMS
-- ========================

CREATE TYPE user_role AS ENUM ('admin', 'staff');
CREATE TYPE attendance_status AS ENUM ('hadir', 'telat', 'izin', 'alpha');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE leave_type AS ENUM ('sakit', 'izin', 'cuti', 'dinas');

-- ========================
-- PROFILES
-- ========================

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  role        user_role NOT NULL DEFAULT 'staff',
  position    TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  nip         TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========================
-- ATTENDANCE
-- ========================

CREATE TABLE IF NOT EXISTS attendance (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  check_in       TIMESTAMPTZ,
  check_out      TIMESTAMPTZ,
  check_in_lat   FLOAT8,
  check_in_lng   FLOAT8,
  check_out_lat  FLOAT8,
  check_out_lng  FLOAT8,
  status         attendance_status NOT NULL DEFAULT 'hadir',
  note           TEXT,
  check_in_photo_url  TEXT,
  check_out_photo_url TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date DESC);

-- ========================
-- LEAVE REQUESTS
-- ========================

CREATE TABLE IF NOT EXISTS leave_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  leave_type     leave_type NOT NULL,
  reason         TEXT NOT NULL,
  attachment_url TEXT,
  status         leave_status NOT NULL DEFAULT 'pending',
  reviewed_by    UUID REFERENCES profiles(id),
  reviewed_at    TIMESTAMPTZ,
  admin_note     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_user ON leave_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);

-- ========================
-- SETTINGS (singleton)
-- ========================

CREATE TABLE IF NOT EXISTS settings (
  id               INT PRIMARY KEY DEFAULT 1,
  school_name      TEXT NOT NULL DEFAULT 'SD NEGERI NGUWOK',
  school_logo_url  TEXT,
  primary_color    TEXT NOT NULL DEFAULT '#006a61',
  school_lat       FLOAT8 NOT NULL DEFAULT -6.2088,   -- Jakarta Pusat (placeholder)
  school_lng       FLOAT8 NOT NULL DEFAULT 106.8456,
  allowed_radius_m INT NOT NULL DEFAULT 100,
  work_start_time  TIME NOT NULL DEFAULT '07:30',
  work_end_time    TIME NOT NULL DEFAULT '15:00',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT settings_singleton CHECK (id = 1)
);

-- Insert default settings row
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ========================
-- ROW LEVEL SECURITY
-- ========================

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES policies
CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT USING (auth.uid() = id OR get_my_role() = 'admin');
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id OR get_my_role() = 'admin');
CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (get_my_role() = 'admin');

-- ATTENDANCE policies
CREATE POLICY "attendance_select" ON attendance FOR SELECT
  USING (auth.uid() = user_id OR get_my_role() = 'admin');

-- Staff can insert their own attendance
CREATE POLICY "attendance_insert" ON attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Staff can ONLY update their OWN attendance IF they haven't checked out yet (prevent editing history)
-- Admin can update anything
CREATE POLICY "attendance_update" ON attendance FOR UPDATE
  USING (
    (auth.uid() = user_id AND check_out IS NULL) 
    OR get_my_role() = 'admin'
  );

-- LEAVE REQUESTS policies
CREATE POLICY "leave_select" ON leave_requests FOR SELECT
  USING (auth.uid() = user_id OR get_my_role() = 'admin');

CREATE POLICY "leave_insert" ON leave_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Staff can ONLY update (cancel/edit) IF it is still pending
-- Admin can update anything
CREATE POLICY "leave_update" ON leave_requests FOR UPDATE
  USING (
    (auth.uid() = user_id AND status = 'pending')
    OR get_my_role() = 'admin'
  );

-- SETTINGS policies
CREATE POLICY "settings_select_all"   ON settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "settings_update_admin" ON settings FOR UPDATE USING (get_my_role() = 'admin');

-- ========================
-- SUPABASE STORAGE
-- ========================

-- Create storage bucket for school assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admin to manage all school assets
DROP POLICY IF EXISTS "school_assets_upload" ON storage.objects;
CREATE POLICY "school_assets_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'school-assets' AND get_my_role() = 'admin');

DROP POLICY IF EXISTS "school_assets_update" ON storage.objects;
CREATE POLICY "school_assets_update" ON storage.objects
  FOR UPDATE WITH CHECK (bucket_id = 'school-assets');

DROP POLICY IF EXISTS "school_assets_view" ON storage.objects;
CREATE POLICY "school_assets_view" ON storage.objects
  FOR SELECT USING (bucket_id = 'school-assets');

-- Create storage bucket for leave attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('leave-attachments', 'leave-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own leave attachments
DROP POLICY IF EXISTS "leave_attachments_upload" ON storage.objects;
CREATE POLICY "leave_attachments_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'leave-attachments' 
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "leave_attachments_view" ON storage.objects;
CREATE POLICY "leave_attachments_view" ON storage.objects
  FOR SELECT USING (bucket_id = 'leave-attachments');

DROP POLICY IF EXISTS "leave_attachments_delete" ON storage.objects;
CREATE POLICY "leave_attachments_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'leave-attachments'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR get_my_role() = 'admin')
  );
