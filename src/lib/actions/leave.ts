'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult, LeaveRequest, LeaveStatus, LeaveType } from '@/lib/types';
import { isAdmin } from './auth';

export async function submitLeave(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi.' };

  const startDate = formData.get('start_date') as string;
  const endDate   = formData.get('end_date')   as string;
  const leaveType = formData.get('leave_type') as LeaveType;
  const reason    = formData.get('reason')     as string;

  if (!startDate || !endDate || !leaveType || !reason) {
    return { success: false, error: 'Semua field wajib diisi.' };
  }
  if (new Date(startDate) > new Date(endDate)) {
    return { success: false, error: 'Tanggal mulai tidak boleh setelah tanggal selesai.' };
  }

  const { error } = await supabase.from('leave_requests').insert({
    user_id: user.id,
    start_date: startDate,
    end_date:   endDate,
    leave_type: leaveType,
    reason,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath('/leave');
  return { success: true, data: undefined };
}

export async function getMyLeaveRequests(): Promise<LeaveRequest[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return data ?? [];
}

// Admin actions
export async function getAllLeaveRequests(status?: LeaveStatus): Promise<LeaveRequest[]> {
  if (!await isAdmin()) return [];
  const supabase = await createClient();
  let query = supabase
    .from('leave_requests')
    .select('*, profiles(full_name, position, avatar_url)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data } = await query;
  return (data ?? []) as unknown as LeaveRequest[];
}

export async function reviewLeave(
  id: string,
  status: 'approved' | 'rejected',
  adminNote?: string
): Promise<ActionResult> {
  if (!await isAdmin()) return { success: false, error: 'Unauthorized.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi.' };

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote ?? null,
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/leave');
  return { success: true, data: undefined };
}
