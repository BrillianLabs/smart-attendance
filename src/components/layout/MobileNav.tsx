'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Profile } from '@/lib/types';
import { logout } from '@/lib/actions/auth';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';

interface MobileNavProps {
  profile: Profile;
}

export function MobileNav({ profile }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const isAdmin = profile.role === 'admin';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Lock scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const mainNavItems = [
    { href: isAdmin ? '/admin' : '/', icon: 'home', label: 'Beranda' },
    { href: '/attendance', icon: 'checklist_rtl', label: 'Presensi' },
    { href: '/leave', icon: 'mail', label: 'Izin' },
  ];

  const adminExtraItems = [
    { href: '/admin/attendance', icon: 'analytics', label: 'Laporan Presensi' },
    { href: '/admin/users', icon: 'group', label: 'Daftar Anggota' },
    { href: '/admin/leave', icon: 'approval_delegation', label: 'Persetujuan Izin' },
    { href: '/admin/settings', icon: 'settings', label: 'Pengaturan' },
  ];

  return (
    <>
      {/* Backdrop */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-md z-[60] animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Drawer Menu */}
      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-[2.5rem] border-t border-outline-variant/10 z-[70] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_-20px_50px_rgba(0,0,0,0.1)]",
        isMenuOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="w-12 h-1.5 bg-outline-variant/20 rounded-full mx-auto mt-4 mb-6" />
        
        <div className="px-8 pb-12 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mb-4 px-2">Menu Lainnya</p>
          
          <div className="grid grid-cols-1 gap-2">
            {isAdmin && adminExtraItems.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95",
                  pathname === href ? "bg-primary/5 text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                <span className="material-symbols-outlined text-[24px]">{icon}</span>
                <span className="text-sm tracking-tight">{label}</span>
              </Link>
            ))}

            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95",
                pathname === '/profile' ? "bg-primary/5 text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              <span className="material-symbols-outlined text-[24px]">person</span>
              <span className="text-sm tracking-tight">Profil Saya</span>
            </Link>

            <button
              onClick={async () => {
                const ok = await confirm({
                  title: 'Konfirmasi Keluar',
                  message: 'Apakah Anda yakin ingin keluar dari sistem?',
                  confirmLabel: 'Ya, Keluar',
                  variant: 'danger'
                });
                if (ok) {
                  setIsMenuOpen(false);
                  const loadingToast = toast.loading('Memproses keluar...');
                  await logout();
                  toast.success('Berhasil keluar. 👋', { id: loadingToast });
                  setTimeout(() => {
                    router.push('/login');
                    router.refresh();
                  }, 800);
                }
              }}
              className="flex items-center gap-4 p-4 rounded-2xl text-error hover:bg-error/5 transition-all active:scale-95 w-full text-left"
            >
              <span className="material-symbols-outlined text-[24px]">logout</span>
              <span className="text-sm font-bold tracking-tight">Keluar dari Sesi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 flex justify-around items-center px-2 py-3 bg-surface-container-lowest/80 backdrop-blur-2xl border border-outline-variant/10 z-50 rounded-[2rem] shadow-[0_20px_50px_rgba(0,106,97,0.15)]">
        {mainNavItems.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center rounded-2xl px-4 py-2 transition-all duration-300 active:scale-90 tap-highlight-transparent group relative',
                active ? 'text-primary' : 'text-outline/40 hover:text-outline/70'
              )}
            >
              {active && (
                <div className="absolute -top-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(0,106,97,0.5)]" />
              )}
              <span 
                className={cn(
                  "material-symbols-outlined transition-all duration-300 text-[24px]",
                  active ? "scale-110 drop-shadow-[0_0_2px_rgba(0,106,97,0.2)]" : ""
                )}
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              <span className={cn(
                "text-[8px] uppercase tracking-[0.15em] font-black mt-1 transition-all duration-300",
                active ? "opacity-100" : "opacity-40"
              )}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center rounded-2xl px-4 py-2 transition-all duration-300 active:scale-90 tap-highlight-transparent group relative',
            isMenuOpen ? 'text-primary' : 'text-outline/40 hover:text-outline/70'
          )}
        >
          {isMenuOpen && (
            <div className="absolute -top-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(0,106,97,0.5)]" />
          )}
          <span 
            className={cn(
              "material-symbols-outlined transition-all duration-300 text-[24px]",
              isMenuOpen ? "scale-110 drop-shadow-[0_0_2px_rgba(0,106,97,0.2)]" : ""
            )}
            style={{ fontVariationSettings: isMenuOpen ? "'FILL' 1" : "'FILL' 0" }}
          >
            more_horiz
          </span>
          <span className={cn(
            "text-[8px] uppercase tracking-[0.15em] font-black mt-1 transition-all duration-300",
            isMenuOpen ? "opacity-100" : "opacity-40"
          )}>
            Lainnya
          </span>
        </button>
      </nav>
    </>
  );
}
