'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult, LeaveRequest, LeaveStatus, LeaveType } from '@/lib/types';
import { isAdmin } from './auth';

export async function submitLeave(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi.' };

  const startDate  = formData.get('start_date') as string;
  const endDate    = formData.get('end_date')   as string;
  const leaveType  = formData.get('leave_type') as LeaveType;
  const reason     = formData.get('reason')     as string;
  const attachment = formData.get('attachment') as File;

  if (!startDate || !endDate || !leaveType || !reason) {
    return { success: false, error: 'Semua field wajib diisi.' };
  }
  if (new Date(startDate) > new Date(endDate)) {
    return { success: false, error: 'Tanggal mulai tidak boleh setelah tanggal selesai.' };
  }

  let attachmentUrl: string | null = null;

  // Handle Attachment Upload
  if (attachment && attachment.size > 0) {
    // Validate size (2MB)
    if (attachment.size > 2 * 1024 * 1024) {
      return { success: false, error: 'Ukuran dokumen maksimal adalah 2MB.' };
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(attachment.type)) {
      return { success: false, error: 'Format dokumen harus JPG atau PDF.' };
    }

    const fileExt = attachment.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `leave-attachments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('leave-attachments')
      .upload(fileName, attachment, {
        upsert: true,
        contentType: attachment.type
      });

    if (uploadError) {
      return { success: false, error: `Gagal mengunggah dokumen: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('leave-attachments')
      .getPublicUrl(fileName);
    
    attachmentUrl = publicUrl;
  }

  const { error } = await supabase.from('leave_requests').insert({
    user_id: user.id,
    start_date: startDate,
    end_date:   endDate,
    leave_type: leaveType,
    reason,
    attachment_url: attachmentUrl,
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
    .select('*, profiles!user_id(full_name, position, avatar_url)')
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
