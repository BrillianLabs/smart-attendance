'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult, Profile, Settings } from '@/lib/types';
import { isAdmin } from './auth';
import sharp from 'sharp';

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
  if (!await isAdmin()) return { success: false, error: 'Unauthorized.' };
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

export async function updateSchoolLocation(lat: number, lng: number): Promise<ActionResult> {
  if (!await isAdmin()) return { success: false, error: 'Unauthorized.' };
  const supabase = await createClient();

  const { error } = await supabase
    .from('settings')
    .update({ school_lat: lat, school_lng: lng, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) return { success: false, error: error.message };

  revalidatePath('/', 'layout');
  return { success: true, data: undefined };
}

export async function uploadLogo(formData: FormData): Promise<ActionResult<string>> {
  if (!await isAdmin()) return { success: false, error: 'Unauthorized.' };
  const supabase = await createClient();
  const file = formData.get('logo') as File;
  if (!file) return { success: false, error: 'File tidak ditemukan.' };

  try {
    // Process image to WebP using Sharp
    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const path = `logo/school-logo.webp`;

    const { error: uploadError } = await supabase.storage
      .from('school-assets')
      .upload(path, webpBuffer, { 
        upsert: true,
        contentType: 'image/webp'
      });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: { publicUrl } } = supabase.storage
      .from('school-assets')
      .getPublicUrl(path);

    await supabase.from('settings').update({ school_logo_url: publicUrl }).eq('id', 1);
    revalidatePath('/', 'layout');
    return { success: true, data: publicUrl };
  } catch (err) {
    console.error('Logo conversion error:', err);
    return { success: false, error: 'Gagal memproses logo. Pastikan format file benar.' };
  }
}

// ========================
// USER MANAGEMENT (Admin)
// ========================
export async function getAllProfiles(): Promise<Profile[]> {
  if (!await isAdmin()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');
  return data ?? [];
}

export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, 'full_name' | 'role' | 'position' | 'phone' | 'is_active' | 'nip'>>
): Promise<ActionResult> {
  if (!await isAdmin()) return { success: false, error: 'Unauthorized.' };
  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/users');
  return { success: true, data: undefined };
}

export async function createStaffUser(
  username: string,
  password: string,
  fullName: string,
  role: 'admin' | 'staff',
  position?: string,
  nip?: string
): Promise<ActionResult> {
  if (!await isAdmin()) return { success: false, error: 'Unauthorized.' };
  const supabase = await createClient();

  // If username doesn't have @, it's a NIP/Username
  const email = username.includes('@') ? username : `${username.trim().replace(/\s/g, '')}@absen.smart`;

  // Use admin API to create user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName, role },
    email_confirm: true,
  });

  if (error) return { success: false, error: error.message };

  if (data.user) {
    const updates: any = {};
    if (position) updates.position = position;
    if (nip) updates.nip = nip;
    
    if (Object.keys(updates).length > 0) {
      await supabase.from('profiles').update(updates).eq('id', data.user.id);
    }
  }

  revalidatePath('/admin/users');
  return { success: true, data: undefined };
}

export async function deleteProfile(id: string): Promise<ActionResult> {
  if (!await isAdmin()) return { success: false, error: 'Unauthorized.' };
  const supabase = await createClient();
  // Soft delete — set is_active = false
  const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/users');
  return { success: true, data: undefined };
}

// Dashboard stats
export async function getAdminStats(date: string) {
  if (!await isAdmin()) return { hadir: 0, telat: 0, izin: 0, alpha: 0, total_staff: 0 };
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
