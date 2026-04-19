'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult, Profile, Settings } from '@/lib/types';

// ========================
// SETTINGS
// ========================
export async function getSettings(): Promise<Settings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();
  return data;
}

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const updates: Partial<Settings> = {
    school_name:      formData.get('school_name')      as string,
    primary_color:    formData.get('primary_color')    as string,
    school_lat:       parseFloat(formData.get('school_lat') as string),
    school_lng:       parseFloat(formData.get('school_lng') as string),
    allowed_radius_m: parseInt(formData.get('allowed_radius_m') as string, 10),
    work_start_time:  formData.get('work_start_time')  as string,
    work_end_time:    formData.get('work_end_time')    as string,
    updated_at:       new Date().toISOString(),
  };

  const { error } = await supabase.from('settings').update(updates).eq('id', 1);
  if (error) return { success: false, error: error.message };

  revalidatePath('/', 'layout');
  return { success: true, data: undefined };
}

export async function uploadLogo(formData: FormData): Promise<ActionResult<string>> {
  const supabase = await createClient();
  const file = formData.get('logo') as File;
  if (!file) return { success: false, error: 'File tidak ditemukan.' };

  const ext = file.name.split('.').pop();
  const path = `logo/school-logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('school-assets')
    .upload(path, file, { upsert: true });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from('school-assets')
    .getPublicUrl(path);

  await supabase.from('settings').update({ school_logo_url: publicUrl }).eq('id', 1);
  revalidatePath('/', 'layout');
  return { success: true, data: publicUrl };
}

// ========================
// USER MANAGEMENT (Admin)
// ========================
export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');
  return data ?? [];
}

export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, 'full_name' | 'role' | 'position' | 'phone' | 'is_active'>>
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/users');
  return { success: true, data: undefined };
}

export async function createStaffUser(
  email: string,
  password: string,
  fullName: string,
  role: 'admin' | 'staff',
  position?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  // Use admin API to create user (requires service role key OR invite URL)
  // With anon key, we use signUp which auto-triggers the profile trigger
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName, role },
    email_confirm: true,
  });

  if (error) return { success: false, error: error.message };

  if (position && data.user) {
    await supabase.from('profiles').update({ position }).eq('id', data.user.id);
  }

  revalidatePath('/admin/users');
  return { success: true, data: undefined };
}

export async function deleteProfile(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  // Soft delete — set is_active = false
  const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/users');
  return { success: true, data: undefined };
}

// Dashboard stats
export async function getAdminStats(date: string) {
  const supabase = await createClient();

  const [{ count: totalStaff }, { data: todayAttendance }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('role', 'staff'),
    supabase.from('attendance').select('status').eq('date', date),
  ]);

  const counts = { hadir: 0, telat: 0, izin: 0, alpha: 0 };
  for (const row of todayAttendance ?? []) {
    counts[row.status as keyof typeof counts] = (counts[row.status as keyof typeof counts] ?? 0) + 1;
  }

  const attended = counts.hadir + counts.telat;
  const total = totalStaff ?? 0;
  counts.alpha = Math.max(0, total - attended - counts.izin);

  return { ...counts, total_staff: total };
}
