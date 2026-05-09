'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ActionResult, Profile } from '@/lib/types';
import { hashNip, decrypt } from '@/lib/utils/encryption';

export async function login(formData: FormData): Promise<ActionResult> {
  let email      = formData.get('email')    as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Username/NIP dan password wajib diisi.' };
  }

  // Pre-process email: if it's just a username/nip (no @), look up real email from profiles
  if (!email.includes('@')) {
    const hashedNip = hashNip(email);
    const supabaseAdmin = await createClient(); 
    
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('nip_hash', hashedNip)
      .single();
    
    if (profile?.email) {
      email = profile.email;
    } else {
      // Fallback to internal domain for legacy users not in Excel
      const cleanNip = email.trim().replace(/\s/g, '');
      email = `${cleanNip}@absen.smart`;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: 'Username atau password salah.' };
  }

  return { success: true, data: undefined };
}

export async function requestPasswordReset(emailOrNip: string): Promise<ActionResult> {
  const supabase = await createClient();
  let email = emailOrNip.trim();

  // If NIP, find the email
  if (!email.includes('@')) {
    const hashedNip = hashNip(email);
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('nip_hash', hashedNip)
      .single();
    
    if (!data?.email) {
      return { success: false, error: 'User dengan NIP tersebut tidak ditemukan.' };
    }
    email = data.email;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function updatePassword(password: string): Promise<ActionResult> {
  if (password.length < 6) return { success: false, error: 'Password minimal 6 karakter.' };
  
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function logout(): Promise<ActionResult> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true, data: undefined };
}

export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log('🔍 [getProfile] User from auth:', user?.email || 'null');
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  console.log('🔍 [getProfile] Profile data:', data ? 'Found' : 'Null');
  if (error) console.log('🔍 [getProfile] Profile error:', error.message);

  if (!data) return null;

  const profile = data as Profile;
  // Decrypt NIP for UI
  if (profile.nip) {
    profile.nip = decrypt(profile.nip);
  }

  return profile;
}

export async function isAdmin() {
  const profile = await getProfile();
  return profile?.role === 'admin' || profile?.role === 'superuser';
}
