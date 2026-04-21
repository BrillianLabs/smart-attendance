'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ActionResult, Profile } from '@/lib/types';

export async function login(formData: FormData): Promise<ActionResult> {
  let email      = formData.get('email')    as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Username/NIP dan password wajib diisi.' };
  }

  // Pre-process email: if it's just a username/nip (no @), append our internal suffix
  if (!email.includes('@')) {
    email = `${email.trim().replace(/\s/g, '')}@absen.smart`;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: 'Username atau password salah.' };
  }

  return { success: true, data: undefined };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}

export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data as Profile;
}

export async function isAdmin() {
  const profile = await getProfile();
  return profile?.role === 'admin';
}
