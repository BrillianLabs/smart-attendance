'use client';

import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings as SettingsIcon, ChevronUp } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { logout } from '@/lib/actions/auth';
import { Profile, Settings } from '@/lib/types';

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      {/* User Section & Interactive Menu */}
      <div className="mt-auto relative" ref={userMenuRef}>
        {/* User Dropup Menu */}
        {isUserMenuOpen && (
          <div className="absolute bottom-full left-0 w-full mb-3 bg-white rounded-2xl shadow-xl border border-outline-variant/10 py-2.5 z-50 animate-fade-in overflow-hidden">
             <Link 
               href="/profile" 
               onClick={() => setIsUserMenuOpen(false)}
               className="flex items-center gap-3 px-4 py-3 text-[0.8125rem] font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all"
             >
                <User size={18} />
                Lihat Profil
             </Link>
             {isAdmin && (
               <Link 
                 href="/admin/settings" 
                 onClick={() => setIsUserMenuOpen(false)}
                 className="flex items-center gap-3 px-4 py-3 text-[0.8125rem] font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all"
               >
                  <SettingsIcon size={18} />
                  Settings
               </Link>
             )}
             <div className="mx-2 my-1.5 h-[1px] bg-outline-variant/20" />
             <form action={logout}>
               <button 
                 type="submit"
                 className="w-full flex items-center gap-3 px-4 py-3 text-[0.8125rem] font-bold text-error hover:bg-error/5 transition-all"
               >
                  <LogOut size={18} />
                  Keluar
               </button>
             </form>
          </div>
        )}

        <button 
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 border border-transparent",
            isUserMenuOpen ? "bg-white border-outline-variant/10 shadow-sm" : "hover:bg-white/50"
          )}
        >
          {profile.avatar_url ? (
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow-sm border border-outline-variant/10 shrink-0">
              <Image src={profile.avatar_url} alt={profile.full_name} width={36} height={36} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[0.8125rem] font-black text-on-surface truncate">{profile.full_name}</p>
            <p className="text-[0.625rem] text-on-surface-variant font-bold uppercase tracking-widest opacity-60 leading-none mt-0.5">{profile.role}</p>
          </div>
          <ChevronUp className={cn("text-outline-variant transition-transform shrink-0", isUserMenuOpen && "rotate-180")} size={16} />
        </button>
      </div>
    </aside>
  );
}
