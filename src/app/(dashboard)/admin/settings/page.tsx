import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getSettings } from '@/lib/actions/admin';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const metadata: Metadata = { title: 'System Configuration | Atelier Academy' };

export default async function AdminSettingsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') redirect('/');

  const settings = await getSettings();

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      {/* Editorial Header */}
      <section className="px-1 max-w-4xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">Control Center</span>
        <h1 className="text-4xl font-black text-on-surface tracking-tight">System <span className="text-primary italic">Configuration</span></h1>
        <p className="text-sm font-medium text-on-surface-variant opacity-60 mt-1">Customize institutional branding, GPS parameters, and work hours.</p>
      </section>

      {/* Main Settings Form Component */}
      <SettingsForm initial={settings} />
    </div>
  );
}
