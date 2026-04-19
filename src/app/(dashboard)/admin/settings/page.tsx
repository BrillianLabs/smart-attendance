import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getSettings } from '@/lib/actions/admin';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const metadata: Metadata = { title: 'Pengaturan' };

export default async function AdminSettingsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') redirect('/');

  const settings = await getSettings();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pengaturan</h1>
        <p className="text-[var(--text-muted)] mt-1">Kustomisasi informasi dan konfigurasi sekolah</p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
