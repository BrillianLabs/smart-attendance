import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getSettings } from '@/lib/actions/admin';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Navbar } from '@/components/layout/Navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);

  if (!profile) redirect('/login');

  // Apply custom primary color as CSS var
  const color = settings?.primary_color ?? '#2563EB';

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Inject custom primary color */}
      <style>{`:root { --primary: ${color}; }`}</style>

      {/* Desktop sidebar */}
      <Sidebar profile={profile} settings={settings} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile navbar */}
        <Navbar profile={profile} settings={settings} />

        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 w-full max-w-full min-w-0 overflow-x-hidden">
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
