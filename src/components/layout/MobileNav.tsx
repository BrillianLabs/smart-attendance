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
    <nav className="md:hidden fixed bottom-6 left-4 right-4 flex justify-around items-center px-2 py-3 bg-surface-container-lowest/80 backdrop-blur-2xl border border-outline-variant/10 z-50 rounded-[2rem] shadow-[0_20px_50px_rgba(0,106,97,0.15)]">
      {navItems.map(({ href, icon, label }) => {
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
    </nav>
  );
}
