import type { Metadata } from 'next';
import { getSettings } from '@/lib/actions/admin';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Masuk' };

export default async function LoginPage() {
  const settings = await getSettings();

  return (
    <LoginForm
      schoolName={settings?.school_name ?? 'SisAbsen'}
      logoUrl={settings?.school_logo_url ?? null}
      primaryColor={settings?.primary_color ?? '#2563EB'}
    />
  );
}
