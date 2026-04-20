'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Profile } from '@/lib/types';

interface MobileNavProps {
  profile: Profile;
}

export function MobileNav({ profile }: MobileNavProps) {
  const pathname = usePathname();
  const isAdmin = profile.role === 'admin';

  const navItems = [
    { href: isAdmin ? '/admin' : '/', icon: 'home', label: 'Beranda' },
    { href: '/attendance', icon: 'checklist_rtl', label: 'Presensi' },
    { href: '/leave', icon: 'mail', label: 'Izin' },
    { href: '/profile', icon: 'person', label: 'Profil' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pt-3 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-100/50 z-50 rounded-t-[2.5rem] shadow-[0_-12px_40px_rgba(0,0,0,0.06)]">
      {navItems.map(({ href, icon, label }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl px-5 py-2 transition-all duration-300 active:scale-90 tap-highlight-transparent group',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-outline/60'
            )}
          >
            <span 
              className={cn(
                "material-symbols-outlined transition-all duration-300",
                active ? "scale-110" : "group-hover:text-primary"
              )}
              style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
            >
              {icon}
            </span>
            <span className={cn(
              "text-[9px] uppercase tracking-[0.1em] font-black mt-1 transition-all duration-300",
              active ? "opacity-100" : "opacity-60"
            )}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
