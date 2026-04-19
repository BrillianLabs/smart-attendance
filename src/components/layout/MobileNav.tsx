'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard, CalendarCheck, FileText, ShieldCheck
} from 'lucide-react';
import { Profile } from '@/lib/types';

interface MobileNavProps {
  profile: Profile;
}

const staffNav = [
  { href: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/attendance', icon: CalendarCheck,   label: 'Absensi' },
  { href: '/leave',      icon: FileText,        label: 'Izin' },
];

export function MobileNav({ profile }: MobileNavProps) {
  const pathname = usePathname();
  const isAdmin  = profile.role === 'admin';

  const navItems = isAdmin
    ? [...staffNav, { href: '/admin', icon: ShieldCheck, label: 'Admin' }]
    : staffNav;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 z-40 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-around">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1.5 px-4 py-3 text-[10px] font-black uppercase tracking-tighter transition-all duration-300 relative',
                active
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <div className={cn(
                'p-1 items-center justify-center transition-all duration-300',
                active ? 'scale-110 -translate-y-0.5' : ''
              )}>
                <Icon size={20} strokeWidth={active ? 3 : 2} />
              </div>
              <span>{label}</span>
              {active && (
                <div className="absolute top-1 w-1 h-1 rounded-full bg-indigo-600"></div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
