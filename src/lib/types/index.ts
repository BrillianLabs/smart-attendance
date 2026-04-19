// TypeScript types for SisAbsen

export type Role = 'admin' | 'staff';
export type AttendanceStatus = 'hadir' | 'telat' | 'izin' | 'alpha';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type LeaveType = 'sakit' | 'izin' | 'cuti' | 'dinas';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  position: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  date: string; // ISO date YYYY-MM-DD
  check_in: string | null; // ISO timestamp
  check_out: string | null; // ISO timestamp
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  status: AttendanceStatus;
  note: string | null;
  created_at: string;
  // joined
  profiles?: Pick<Profile, 'full_name' | 'position' | 'avatar_url'>;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  reason: string;
  attachment_url: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_note: string | null;
  created_at: string;
  // joined
  profiles?: Pick<Profile, 'full_name' | 'position' | 'avatar_url'>;
}

export interface Settings {
  id: number;
  school_name: string;
  school_logo_url: string | null;
  primary_color: string;
  school_lat: number;
  school_lng: number;
  allowed_radius_m: number;
  work_start_time: string; // HH:MM
  work_end_time: string;   // HH:MM
  updated_at: string;
}

export interface DashboardStats {
  hadir: number;
  telat: number;
  izin: number;
  alpha: number;
  total_staff: number;
}

export interface AttendanceSummary {
  date: string;
  hadir: number;
  telat: number;
  izin: number;
  alpha: number;
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
