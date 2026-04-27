'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult, Attendance } from '@/lib/types';
import { format } from 'date-fns';
import { formatWIB } from '@/lib/utils/date';
import { isAdmin } from './auth';
import { checkTeleportation, checkAccuracy, checkRoundCoordinates } from '@/lib/utils/fakeGpsDetector';
import sharp from 'sharp';

export async function checkIn(
  lat: number,
  lng: number,
  photoBase64?: string
): Promise<ActionResult<Attendance>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi.' };

  // ── Server-side GPS validation ──────────────────────────────────────────
  const accuracyFromClient = null; // lat/lng come from client — do coordinate checks
  const roundCheck = checkRoundCoordinates(lat, lng);
  if (roundCheck.isSuspicious) return { success: false, error: `🚫 GPS Palsu Terdeteksi: ${roundCheck.reason}` };

  // Teleportation check: compare with last recent attendance record
  const { data: lastAtt } = await supabase
    .from('attendance')
    .select('check_in_lat, check_in_lng, check_in')
    .eq('user_id', user.id)
    .not('check_in', 'is', null)
    .not('check_in_lat', 'is', null)
    .order('check_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastAtt?.check_in_lat && lastAtt?.check_in_lng && lastAtt?.check_in) {
    const teleportCheck = checkTeleportation(
      lastAtt.check_in_lat, lastAtt.check_in_lng, lastAtt.check_in,
      lat, lng
    );
    if (teleportCheck.isSuspicious) {
      return { success: false, error: `🚫 GPS Palsu Terdeteksi: ${teleportCheck.reason}` };
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const today = formatWIB(new Date(), 'yyyy-MM-dd');

  // Check if already checked in today
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  if (existing?.check_in) {
    return { success: false, error: 'Anda sudah melakukan absen masuk hari ini.' };
  }

  // Get work start time from settings
  const { data: settings } = await supabase
    .from('settings')
    .select('work_start_time')
    .eq('id', 1)
    .single();

  const now = new Date();
  let status: 'hadir' | 'telat' = 'hadir';

  if (settings?.work_start_time) {
    const [h, m] = settings.work_start_time.split(':').map(Number);
    const workStart = new Date(now);
    workStart.setHours(h, m, 0, 0);
    if (now > workStart) status = 'telat';
  }

  const checkInTime = now.toISOString();

  // Automatic Avatar Registration: If user has no photo, save this one as their profile photo
  const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
  const shouldUpdateProfile = photoBase64 && !profile?.avatar_url;

  if (existing) {
    // Update existing record (created by leave system or alpha)
    // Handle photo upload if provided
    let photo_url = existing.check_in_photo_url;
    if (photoBase64) {
      photo_url = await uploadVerificationPhoto(user.id, 'check_in', photoBase64);
      
      // Update profile avatar if missing
      if (shouldUpdateProfile && photo_url) {
        await supabase.from('profiles').update({ avatar_url: photo_url }).eq('id', user.id);
      }
    }

    const { data, error } = await supabase
      .from('attendance')
      .update({ 
        check_in: checkInTime, 
        check_in_lat: lat, 
        check_in_lng: lng, 
        status,
        check_in_photo_url: photo_url 
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath('/');
    revalidatePath('/attendance');
    return { success: true, data };
  }

    // Handle photo upload
    let photo_url = null;
    if (photoBase64) {
      photo_url = await uploadVerificationPhoto(user.id, 'check_in', photoBase64);
      
      // Update profile avatar if missing
      if (shouldUpdateProfile && photo_url) {
        await supabase.from('profiles').update({ avatar_url: photo_url }).eq('id', user.id);
      }
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        user_id: user.id,
        date: today,
        check_in: checkInTime,
        check_in_lat: lat,
        check_in_lng: lng,
        status,
        check_in_photo_url: photo_url,
      })
      .select()
      .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/');
  revalidatePath('/attendance');
  return { success: true, data };
}

export async function checkOut(
  lat: number,
  lng: number,
  photoBase64?: string
): Promise<ActionResult<Attendance>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi.' };

  const today = formatWIB(new Date(), 'yyyy-MM-dd');

  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  if (!existing?.check_in) {
    return { success: false, error: 'Anda belum melakukan absen masuk hari ini.' };
  }
  if (existing?.check_out) {
    return { success: false, error: 'Anda sudah melakukan absen pulang hari ini.' };
  }

  // ── Server-side GPS validation ──────────────────────────────────────────
  const roundCheck2 = checkRoundCoordinates(lat, lng);
  if (roundCheck2.isSuspicious) return { success: false, error: `🚫 GPS Palsu Terdeteksi: ${roundCheck2.reason}` };

  if (existing.check_in_lat && existing.check_in_lng && existing.check_in) {
    const teleportCheck = checkTeleportation(
      existing.check_in_lat, existing.check_in_lng, existing.check_in,
      lat, lng
    );
    if (teleportCheck.isSuspicious) {
      return { success: false, error: `🚫 GPS Palsu Terdeteksi: ${teleportCheck.reason}` };
    }
  }
  // ────────────────────────────────────────────────────────────────────────

    let photo_url = existing.check_out_photo_url;
    if (photoBase64) {
      photo_url = await uploadVerificationPhoto(user.id, 'check_out', photoBase64);
    }

    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out: new Date().toISOString(),
        check_out_lat: lat,
        check_out_lng: lng,
        check_out_photo_url: photo_url,
      })
      .eq('id', existing.id)
      .select()
      .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/');
  revalidatePath('/attendance');
  return { success: true, data };
}

export async function getTodayAttendance(): Promise<Attendance | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = formatWIB(new Date(), 'yyyy-MM-dd');
  const { data } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  return data;
}

export async function getMyAttendanceHistory(limit = 30): Promise<Attendance[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit);

  return data ?? [];
}

// Admin: get all attendance with filters
export async function getAdminAttendance(params: {
  date?: string;
  month?: string;  // YYYY-MM
  userId?: string;
  limit?: number;
}): Promise<Attendance[]> {
  if (!await isAdmin()) return [];
  const supabase = await createClient();

  let query = supabase
    .from('attendance')
    .select('*, profiles(full_name, position, avatar_url)')
    .order('date', { ascending: false });

  if (params.date) {
    query = query.eq('date', params.date);
  } else if (params.month) {
    const start = `${params.month}-01`;
    const [y, m] = params.month.split('-').map(Number);
    const end = new Date(y, m, 0);
    query = query.gte('date', start).lte('date', formatWIB(end, 'yyyy-MM-dd'));
  }

  if (params.userId) query = query.eq('user_id', params.userId);
  if (params.limit)  query = query.limit(params.limit);

  const { data } = await query;
  return (data ?? []) as unknown as Attendance[];
}

export async function getMonthlyStats(month: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('attendance')
    .select('date, status')
    .gte('date', `${month}-01`)
    .lte('date', `${month}-31`);

  const grouped: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    if (!grouped[row.date]) grouped[row.date] = { hadir: 0, telat: 0, izin: 0, alpha: 0 };
    grouped[row.date][row.status] = (grouped[row.date][row.status] ?? 0) + 1;
  }
  return Object.entries(grouped)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function uploadVerificationPhoto(userId: string, type: 'check_in' | 'check_out', base64: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const today = formatWIB(new Date(), 'yyyy-MM-dd');
    const path = `${userId}/${today}-${type}.webp`;
    
    // Convert base64 to buffer
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Convert to WebP using Sharp (Quality 70 for logs, max 800px)
    const webpBuffer = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();

    const { error } = await supabase.storage
      .from('attendance-photos')
      .upload(path, webpBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) {
      console.error('Photo upload failed:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('attendance-photos')
      .getPublicUrl(path);

    return publicUrl;
  } catch (err) {
    console.error('Upload process error:', err);
    return null;
  }
}
