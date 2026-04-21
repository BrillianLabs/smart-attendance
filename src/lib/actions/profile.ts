'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/lib/types';
import sharp from 'sharp';

export async function updateProfileMetadata(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi.' };

  const full_name = formData.get('full_name') as string;
  const position = formData.get('position') as string;
  const phone    = formData.get('phone') as string;

  if (!full_name) return { success: false, error: 'Nama lengkap wajib diisi.' };

  const { error } = await supabase
    .from('profiles')
    .update({ 
      full_name, 
      position, 
      phone,
      updated_at: new Date().toISOString() 
    })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/profile');
  revalidatePath('/');
  return { success: true, data: undefined };
}

export async function updateProfileAvatar(base64: string): Promise<ActionResult<string>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Tidak terautentikasi.' };

  try {
    const path = `${user.id}/profile-avatar.webp`;
    
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Convert to WebP using Sharp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const { error: uploadError } = await supabase.storage
      .from('school-assets')
      .upload(path, webpBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: { publicUrl } } = supabase.storage
      .from('school-assets')
      .getPublicUrl(path);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) return { success: false, error: updateError.message };

    revalidatePath('/profile');
    revalidatePath('/');
    return { success: true, data: publicUrl };
  } catch (err) {
    console.error('Avatar upload error:', err);
    return { success: false, error: 'Gagal mengunggah foto.' };
  }
}
