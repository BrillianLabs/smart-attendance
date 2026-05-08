'use client';

import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings as SettingsIcon, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { logout } from '@/lib/actions/auth';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';
import { Profile, Settings } from '@/lib/types';

interface SidebarProps {
  profile: Profile;
  settings: Settings | null;
}

const staffNav = [
  { href: '/',           icon: 'dashboard', label: 'Beranda' },
  { href: '/attendance', icon: 'calendar_today',   label: 'Presensi' },
  { href: '/leave',      icon: 'event_busy',        label: 'Izin' },
];

const adminNav = [
  { href: '/admin',          icon: 'admin_panel_settings', label: 'Panel Admin' },
  { href: '/admin/attendance', icon: 'analytics',          label: 'Laporan Presensi' },
  { href: '/admin/users',    icon: 'group',          label: 'Daftar Anggota' },
  { href: '/admin/leave',    icon: 'approval_delegation', label: 'Persetujuan Izin' },
  { href: '/admin/settings', icon: 'settings',      label: 'Pengaturan' },
];

export function Sidebar({ profile, settings }: SidebarProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const pathname = usePathname();
  const isAdmin  = profile.role === 'admin';
  const navItems = isAdmin ? [...staffNav, ...adminNav] : staffNav;
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Initialize collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setIsCollapsed(true);
    setIsMounted(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    }
  }, [isCollapsed, isMounted]);

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

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 bg-surface-container-low border-r border-outline-variant/10 transition-all duration-300 ease-in-out z-40 group/sidebar",
        isCollapsed ? "w-20 p-4" : "w-[280px] p-6"
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 bg-surface-container-lowest border border-outline-variant/10 rounded-full flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-all z-50 opacity-0 group-hover/sidebar:opacity-100"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Branding Header */}
      <div className={cn(
        "mb-10 px-2 mt-2 flex items-center gap-4 transition-all duration-300",
        isCollapsed ? "justify-center px-0" : "justify-start"
      )}>
        {settings?.school_logo_url && (
          <div className="w-10 h-10 rounded-xl bg-surface-container-lowest p-1 shadow-sm border border-outline-variant/10 shrink-0 flex items-center justify-center overflow-hidden">
             <Image 
               src={settings.school_logo_url} 
               alt="Logo" 
               width={40} 
               height={40} 
               className="w-full h-full object-contain"
             />
          </div>
        )}
        {!isCollapsed && (
          <div className="min-w-0 animate-fade-in">
            <h1 className="text-lg font-black tracking-tighter uppercase text-primary leading-none">
              {process.env.NEXT_PUBLIC_APP_NAME ?? 'SIGAP'} v1.0
            </h1>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto pr-2 scrollbar-hide">
        {navItems.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : ""}
              className={cn(
                'flex items-center rounded-xl transition-all duration-200 ease-in-out group relative',
                isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                active
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm shadow-primary/5'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 hover:text-primary'
              )}
            >
              <span className={cn(
                "material-symbols-outlined transition-transform duration-200",
                active ? "text-primary scale-110" : "text-outline group-hover:scale-110 group-hover:text-primary"
              )} style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                {icon}
              </span>
              {!isCollapsed && (
                <span className="text-[0.875rem] tracking-tight truncate animate-fade-in">{label}</span>
              )}
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
          <div className={cn(
            "absolute bottom-full left-0 mb-3 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/10 py-2.5 z-50 animate-fade-in overflow-hidden",
            isCollapsed ? "w-48 left-12" : "w-full"
          )}>
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
                  Pengaturan
               </Link>
             )}
             <div className="mx-2 my-1.5 h-[1px] bg-outline-variant/20" />
              <button 
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Konfirmasi Keluar',
                    message: 'Apakah Anda yakin ingin keluar dari sistem presensi?',
                    confirmLabel: 'Ya, Keluar',
                    variant: 'danger'
                  });
                  if (ok) {
                    setIsUserMenuOpen(false);
                    const loadingToast = toast.loading('Memproses keluar...');
                    await logout();
                    toast.success('Berhasil keluar. Sampai jumpa! 👋', { id: loadingToast });
                    
                    setTimeout(() => {
                      router.push('/login');
                      router.refresh();
                    }, 800);
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[0.8125rem] font-bold text-error hover:bg-error/5 transition-all"
              >
                 <LogOut size={18} />
                 Keluar
              </button>
          </div>
        )}

        <button 
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={cn(
            "w-full flex items-center transition-all duration-200 border border-transparent rounded-2xl",
            isCollapsed ? "justify-center p-2" : "gap-3 p-3",
            isUserMenuOpen ? "bg-surface-container-lowest border-outline-variant/10 shadow-sm" : "hover:bg-surface-container-high"
          )}
        >
          {profile.avatar_url ? (
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-sm border border-outline-variant/10 shrink-0">
              <Image src={profile.avatar_url} alt={profile.full_name} width={36} height={36} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0 flex-1 text-left animate-fade-in">
              <p className="text-[0.8125rem] font-black text-on-surface truncate">{profile.full_name}</p>
              <p className="text-[0.625rem] text-on-surface-variant font-bold uppercase tracking-widest opacity-60 leading-none mt-0.5">{profile.role}</p>
            </div>
          )}
          {!isCollapsed && (
            <ChevronUp className={cn("text-outline-variant transition-transform shrink-0", isUserMenuOpen && "rotate-180")} size={16} />
          )}
        </button>
      </div>
    </aside>
  );
}
