'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { logout } from '@/lib/actions/auth';
import { Profile, Settings } from '@/lib/types';
import Image from 'next/image';

interface SidebarProps {
  profile: Profile;
  settings: Settings | null;
}

const staffNav = [
  { href: '/',           icon: 'dashboard', label: 'Dashboard' },
  { href: '/attendance', icon: 'calendar_today',   label: 'Presensi' },
  { href: '/leave',      icon: 'event_busy',        label: 'Izin' },
];

const adminNav = [
  { href: '/admin',          icon: 'admin_panel_settings', label: 'Admin Panel' },
  { href: '/admin/users',    icon: 'group',          label: 'Data Pengguna' },
  { href: '/admin/leave',    icon: 'approval_delegation', label: 'Persetujuan' },
  { href: '/admin/settings', icon: 'settings',      label: 'Pengaturan' },
];

export function Sidebar({ profile, settings }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin  = profile.role === 'admin';
  const navItems = isAdmin ? [...staffNav, ...adminNav] : staffNav;

  return (
    <aside
      className="hidden lg:flex flex-col h-screen sticky top-0 bg-surface-container-low border-r border-outline-variant/10 p-6 gap-2"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Branding Header */}
      <div className="mb-10 px-2 mt-2">
        <h1 className="text-lg font-black tracking-[0.15em] uppercase text-primary leading-tight">
          {settings?.school_name ?? 'Atelier Academy'}
        </h1>
        <p className="text-[0.75rem] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">
          Academic Atelier
        </p>
      </div>

      {/* Navigation Groups */}
      <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto pr-2 scrollbar-hide">
        {navItems.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out group relative',
                active
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm shadow-primary/5'
                  : 'text-on-surface-variant hover:bg-white/50 hover:translate-x-1 hover:text-primary'
              )}
            >
              <span className={cn(
                "material-symbols-outlined transition-transform duration-200",
                active ? "text-primary scale-110" : "text-outline group-hover:scale-110 group-hover:text-primary"
              )} style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                {icon}
              </span>
              <span className="text-[0.875rem] tracking-tight">{label}</span>
              {active && (
                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section & Logout */}
      <div className="mt-auto pt-6 border-t border-outline-variant/10 flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2 py-2">
          {profile.avatar_url ? (
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow-sm border border-outline-variant/10">
              <Image src={profile.avatar_url} alt={profile.full_name} width={36} height={36} className="object-cover" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-sm font-bold shadow-sm">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[0.8125rem] font-bold text-on-surface truncate">{profile.full_name}</p>
            <p className="text-[0.625rem] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">{profile.role}</p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full text-on-surface-variant hover:text-error hover:bg-error-container/5 transition-all duration-200 flex items-center gap-3 px-4 py-3 rounded-xl group"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">logout</span>
            <span className="text-[0.875rem] font-bold">Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
