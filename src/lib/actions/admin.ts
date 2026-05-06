'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult, Profile, Settings, Role } from '@/lib/types';
import { isAdmin } from './auth';
import sharp from 'sharp';
import { encrypt, decrypt, hashNip } from '@/lib/utils/encryption';

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
    if (buffer.length === 0) return { success: false, error: 'File kosong atau tidak terbaca.' };

    const webpBuffer = await sharp(buffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
      .catch(err => {
        console.error('Sharp error:', err);
        throw new Error('Gagal mengonversi gambar ke format WebP.');
      });

    const timestamp = Date.now();
    const path = `logo/school-logo-${timestamp}.webp`;

    const { error: uploadError } = await supabase.storage
      .from('school-assets')
      .upload(path, webpBuffer, { 
        upsert: true,
        contentType: 'image/webp'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: `Gagal mengunggah ke storage: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('school-assets')
      .getPublicUrl(path);

    const { error: dbError } = await supabase.from('settings').update({ school_logo_url: publicUrl }).eq('id', 1);
    if (dbError) throw new Error(`Gagal menyimpan URL logo ke database: ${dbError.message}`);

    revalidatePath('/', 'layout');
    return { success: true, data: publicUrl };
  } catch (err: any) {
    console.error('Logo conversion error:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan sistem saat memproses logo.' };
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
  
  if (!data) return [];

  // Decrypt NIPs for display
  return data.map(p => ({
    ...p,
    nip: decrypt(p.nip || '')
  }));
}

export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, 'full_name' | 'role' | 'position' | 'phone' | 'is_active' | 'nip' | 'email'>>
): Promise<ActionResult> {
  if (!await isAdmin()) return { success: false, error: 'Unauthorized.' };
  const supabase = await createClient();

  // If email is being updated, we must update it in Supabase Auth as well
  if (updates.email) {
    const { error: authError } = await supabase.auth.admin.updateUserById(id, {
      email: updates.email,
      email_confirm: true
    });
    if (authError) {
      console.error('Error updating auth email:', authError.message);
      return { success: false, error: `Gagal update email di sistem Auth: ${authError.message}` };
    }
  }

  // Handle NIP encryption and hash
  if (updates.nip) {
    (updates as any).nip_hash = hashNip(updates.nip);
    updates.nip = encrypt(updates.nip);
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/users');
  return { success: true, data: undefined };
}

export async function createStaffUser(
  username: string,
  password: string,
  fullName: string,
  role: Role,
  position?: string,
  nip?: string,
  realEmail?: string
): Promise<ActionResult> {
  if (!await isAdmin()) return { success: false, error: 'Unauthorized.' };
  const supabase = await createClient();

  // Primary email for Auth. Use realEmail if provided, otherwise derive from username
  const authEmail = realEmail || (username.includes('@') ? username : `${username.trim().replace(/\s/g, '')}@absen.smart`);

  // Use admin API to create user
  const { data, error } = await supabase.auth.admin.createUser({
    email: authEmail,
    password,
    user_metadata: { full_name: fullName, role, nip: nip || username },
    email_confirm: true,
  });

  if (error) return { success: false, error: error.message };

  if (data.user) {
    const profileUpdates: any = {
      email: authEmail, 
    };
    if (position) profileUpdates.position = position;
    if (nip) {
      profileUpdates.nip = encrypt(nip);
      profileUpdates.nip_hash = hashNip(nip);
    }
    
    // Profiles row is automatically created by trigger, so we update it
    const { error: profError } = await supabase.from('profiles').update(profileUpdates).eq('id', data.user.id);
    if (profError) console.error('Error updating profile after create:', profError.message);
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
  if (!await isAdmin()) return { hadir: 0, telat: 0, izin: 0, alpha: 0, total_staff: 0, pending_izin: 0 };
  const supabase = await createClient();

  const [
    { count: totalStaff },
    { data: todayAttendance },
    { count: pendingIzin },
    { count: approvedIzin }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('role', 'staff'),
    supabase.from('attendance').select('status').eq('date', date),
    // Pending: izin yg menunggu persetujuan hari ini
    supabase.from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('start_date', date)
      .gte('end_date', date),
    // Approved: izin yg sudah disetujui untuk hari ini
    // (fallback jika sinkronisasi ke tabel attendance belum berhasil)
    supabase.from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .lte('start_date', date)
      .gte('end_date', date),
  ]);

  const counts = { hadir: 0, telat: 0, izin: 0, alpha: 0 };
  for (const row of todayAttendance ?? []) {
    const status = row.status as string;
    if (status === 'hadir' || status === 'datang_awal') {
      counts.hadir++;
    } else if (status === 'telat') {
      counts.telat++;
    } else if (status === 'izin') {
      counts.izin++;
    } else if (status === 'alpha' || status === 'tidak_masuk') {
      counts.alpha++;
    }
  }

  // Gunakan nilai tertinggi antara tabel attendance dan leave_requests (approved)
  // untuk menghindari angka 0 jika sinkronisasi attendance belum berhasil
  counts.izin = Math.max(counts.izin, approvedIzin ?? 0);

  const attended = counts.hadir + counts.telat;
  const total = totalStaff ?? 0;
  counts.alpha = Math.max(0, total - attended - counts.izin);

  return { ...counts, total_staff: total, pending_izin: pendingIzin ?? 0 };
}
