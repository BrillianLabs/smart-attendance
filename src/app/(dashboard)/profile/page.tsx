import { getProfile } from '@/lib/actions/auth';
import { ProfileClient } from '@/components/profile/ProfileClient';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profil Saya',
  description: 'Kelola informasi profil dan foto verifikasi wajah AI.',
};

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-on-surface tracking-tight">Pengaturan Profil</h1>
        <p className="text-sm font-bold text-on-surface-variant mt-2 opacity-60">
          Kelola data diri dan foto referensi untuk sistem verifikasi wajah.
        </p>
      </div>

      <ProfileClient key={profile.updated_at} profile={profile} />
    </div>
  );
}
