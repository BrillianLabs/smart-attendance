import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getProfile } from '@/lib/actions/auth';
import { getSettings } from '@/lib/actions/admin';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Navbar } from '@/components/layout/Navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);

  if (!profile) redirect('/login');

  return (
    <div className="flex min-h-screen bg-surface-container-lowest transition-colors duration-500">
      {/* Sidebar for Desktop */}
      <Sidebar profile={profile} settings={settings} />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar (Fixed/Sticky handled inside Navbar component) */}
        <Navbar profile={profile} settings={settings} />

        {/* 
            Content area 
            pt-16 to clear the fixed navbar 
            lg:p-12 to match high-end padding from template 
        */}
        <main className="flex-1 pt-24 px-4 sm:px-8 lg:px-12 pb-24 lg:pb-12 w-full max-w-full min-w-0 overflow-x-hidden">
          <div className="max-w-full w-full min-w-0">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav profile={profile} />
    </div>
  );
}
