'use client';

import { Menu, Bell } from 'lucide-react';
import { Profile, Settings } from '@/lib/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Image from 'next/image';
import { GraduationCap } from 'lucide-react';

interface NavbarProps {
  profile: Profile;
  settings: Settings | null;
}

export function Navbar({ profile, settings }: NavbarProps) {
  const now = new Date();

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4"
            style={{ height: 'var(--navbar-height)' }}>
      <div className="flex items-center justify-between h-full">
        {/* School brand */}
        <div className="flex items-center gap-2.5">
          {settings?.school_logo_url ? (
            <div className="p-1 bg-white rounded-xl shadow-sm border border-slate-50">
              <Image
                src={settings.school_logo_url}
                alt="Logo"
                width={28} height={28}
                className="rounded-lg object-contain"
              />
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100"
              style={{ background: `linear-gradient(135deg, ${settings?.primary_color ?? 'var(--primary)'} 0%, #6366f1 100%)` }}
            >
              <GraduationCap size={18} className="text-white" />
            </div>
          )}
          <div>
            <p className="text-xs font-black text-slate-800 leading-tight line-clamp-1 uppercase tracking-tight">
              {settings?.school_name ?? 'Sis Smart'}
            </p>
            <p className="text-[10px] font-bold text-slate-400 capitalize">
              {format(now, 'EEEE, d MMMM', { locale: idLocale })}
            </p>
          </div>
        </div>

        {/* Right: avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-100"
          style={{ background: `linear-gradient(135deg, ${settings?.primary_color ?? 'var(--primary)'} 0%, #6366f1 100%)` }}
        >
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
