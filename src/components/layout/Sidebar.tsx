'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard, CalendarCheck, FileText,
  Users, Settings2, ShieldCheck, LogOut, GraduationCap
} from 'lucide-react';
import { logout } from '@/lib/actions/auth';
import { Profile, Settings } from '@/lib/types';
import Image from 'next/image';

interface SidebarProps {
  profile: Profile;
  settings: Settings | null;
}

const staffNav = [
  { href: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/attendance', icon: CalendarCheck,   label: 'Absensi' },
  { href: '/leave',      icon: FileText,        label: 'Izin' },
];

const adminNav = [
  { href: '/admin',          icon: ShieldCheck,    label: 'Admin Dashboard' },
  { href: '/admin/users',    icon: Users,          label: 'Kelola Pengguna' },
  { href: '/admin/leave',    icon: FileText,       label: 'Persetujuan Izin' },
  { href: '/admin/settings', icon: Settings2,      label: 'Pengaturan' },
];

export function Sidebar({ profile, settings }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin  = profile.role === 'admin';
  const navItems = isAdmin ? [...staffNav, ...adminNav] : staffNav;

  return (
    <aside
      className="hidden lg:flex flex-col h-screen sticky top-0 border-r border-[var(--border)] bg-[var(--surface)]"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border)]">
        {settings?.school_logo_url ? (
          <Image
            src={settings.school_logo_url}
            alt="Logo"
            width={36} height={36}
            className="rounded-lg object-contain"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
               style={{ background: settings?.primary_color ?? 'var(--primary)' }}>
            <GraduationCap size={20} className="text-white" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate leading-tight">
            {settings?.school_name ?? 'SisAbsen'}
          </p>
          <p className="text-xs text-[var(--text-muted)]">Sistem Absensi</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Menu Utama</p>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative group',
                active
                  ? 'text-white shadow-lg shadow-indigo-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              )}
              style={active ? { background: `linear-gradient(135deg, ${settings?.primary_color ?? 'var(--primary)'} 0%, #6366f1 100%)` } : {}}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} className={cn('transition-transform duration-300', active ? 'scale-110' : 'group-hover:scale-110')} />
              <span>{label}</span>
              {active && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Area */}
      <div className="p-4 mx-2 mb-2 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 mb-3">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-black shadow-md shadow-indigo-100 flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${settings?.primary_color ?? 'var(--primary)'} 0%, #6366f1 100%)` }}
            >
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white p-0.5 border border-slate-100 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-emerald-500"></div>
            </div>
          </div>
          <div className="min-w-0 pr-2">
            <p className="text-sm font-bold text-slate-800 truncate leading-tight">{profile.full_name}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {profile.role === 'admin' ? 'Administrator' : profile.position ?? 'Level: Anggota'}
            </p>
          </div>
        </div>
        
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-100 shadow-sm"
          >
            <LogOut size={14} strokeWidth={3} />
            Keluar Aplikasi
          </button>
        </form>
      </div>
    </aside>
  );
}
