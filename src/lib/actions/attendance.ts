'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult, Attendance } from '@/lib/types';
import { format } from 'date-fns';
import { isAdmin } from './auth';

export async function checkIn(
  lat: number,
  lng: number
): Promise<ActionResult<Attendance>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi.' };

  const today = format(new Date(), 'yyyy-MM-dd');

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

  if (existing) {
    // Update existing record (created by leave system or alpha)
    const { data, error } = await supabase
      .from('attendance')
      .update({ check_in: checkInTime, check_in_lat: lat, check_in_lng: lng, status })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath('/');
    revalidatePath('/attendance');
    return { success: true, data };
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
  lng: number
): Promise<ActionResult<Attendance>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi.' };

  const today = format(new Date(), 'yyyy-MM-dd');

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

  const { data, error } = await supabase
    .from('attendance')
    .update({
      check_out: new Date().toISOString(),
      check_out_lat: lat,
      check_out_lng: lng,
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

  const today = format(new Date(), 'yyyy-MM-dd');
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
    query = query.gte('date', start).lte('date', format(end, 'yyyy-MM-dd'));
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
