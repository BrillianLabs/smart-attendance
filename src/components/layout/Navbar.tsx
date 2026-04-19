'use client';

import { useState, useRef, useEffect } from 'react';
import { logout } from '@/lib/actions/auth';
import { User, LogOut, Shield } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { Profile, Settings } from '@/lib/types';

interface NavbarProps {
  profile: Profile;
  settings: Settings | null;
}

export function Navbar({ profile, settings }: NavbarProps) {
  const pathname = usePathname();
  const isAdmin = profile.role === 'admin';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 right-0 z-50 bg-white/80 backdrop-blur-[24px] shadow-sm shadow-primary/5 h-16 flex justify-between items-center px-6 lg:px-8 transition-all duration-300 border-b border-outline-variant/10",
      isAdmin ? "lg:left-[var(--sidebar-width)] left-0" : "left-0"
    )}>
      <div className="flex items-center gap-8">
        {/* Brand for Mobile & Teacher/Student Views */}
        <div className={cn(
          "flex items-center gap-3",
          isAdmin ? "lg:hidden" : "flex"
        )}>
           <span className="text-xl font-bold tracking-tighter text-primary">
            {settings?.school_name ?? 'Atelier Academy'}
          </span>
        </div>

        {/* Global Nav Links (Standard in Templates) */}
        {!isAdmin && (
          <nav className="hidden md:flex gap-8 font-medium">
            <Link 
              href="/" 
              className={cn(
                "text-sm tracking-tight transition-all duration-200",
                pathname === '/' ? "text-primary font-bold border-b-2 border-primary pb-1" : "text-on-surface-variant hover:text-primary"
              )}
            >
              Dashboard
            </Link>
            <Link 
              href="/attendance" 
              className={cn(
                "text-sm tracking-tight transition-all duration-200",
                pathname === '/attendance' ? "text-primary font-bold border-b-2 border-primary pb-1" : "text-on-surface-variant hover:text-primary"
              )}
            >
              Attendance
            </Link>
            <Link 
              href="/leave" 
              className={cn(
                "text-sm tracking-tight transition-all duration-200",
                pathname === '/leave' ? "text-primary font-bold border-b-2 border-primary pb-1" : "text-on-surface-variant hover:text-primary"
              )}
            >
              Leave Requests
            </Link>
          </nav>
        )}

        {/* Admin Specific Links (Category view from Template) */}
        {isAdmin && (
          <nav className="hidden lg:flex gap-7 font-medium">
            <Link 
              href="/admin" 
              className={cn(
                "text-sm tracking-tight transition-all duration-200",
                pathname === '/admin' ? "text-primary font-bold border-b-2 border-primary pb-1" : "text-on-surface-variant hover:text-primary"
              )}
            >
              Overview
            </Link>
            <Link 
              href="/admin/users" 
              className={cn(
                "text-sm tracking-tight transition-all duration-200",
                pathname === '/admin/users' ? "text-primary font-bold border-b-2 border-primary pb-1" : "text-on-surface-variant hover:text-primary"
              )}
            >
              Directory
            </Link>
            <Link 
              href="/admin/leave" 
              className={cn(
                "text-sm tracking-tight transition-all duration-200",
                pathname === '/admin/leave' ? "text-primary font-bold border-b-2 border-primary pb-1" : "text-on-surface-variant hover:text-primary"
              )}
            >
              Approvals
            </Link>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        {/* Tonal Search Bar */}
        <div className="hidden sm:relative group sm:block">
          <span className="material-symbols-outlined text-outline absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">search</span>
          <input 
            className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-[0.8125rem] w-48 lg:w-64 focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline/50" 
            placeholder="Search data..." 
            type="text"
          />
        </div>

        <div className="flex items-center gap-2 lg:gap-3" ref={menuRef}>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all active:scale-95 group">
            <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">notifications</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 rounded-full bg-surface-container-high border border-outline-variant/10 overflow-hidden shadow-sm flex items-center justify-center hover:ring-2 hover:ring-primary transition-all active:scale-90"
            >
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="Profile" width={36} height={36} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[0.8125rem] font-bold text-primary">
                  {profile.full_name.charAt(0).toUpperCase()}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-[1.5rem] shadow-2xl border border-outline-variant/10 py-3 z-[60] animate-fade-in divide-y divide-outline-variant/5">
                <div className="px-5 py-3">
                  <p className="text-[0.8125rem] font-black text-on-surface line-clamp-1">{profile.full_name}</p>
                  <p className="text-[0.625rem] text-on-surface-variant font-bold uppercase tracking-widest opacity-60 mt-0.5">{profile.role}</p>
                </div>
                
                <div className="py-2">
                  <Link 
                    href="/profile" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-5 py-2.5 text-[0.8125rem] font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <User size={16} />
                    Profil Saya
                  </Link>
                  {isAdmin && (
                    <Link 
                      href="/admin/settings" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-5 py-2.5 text-[0.8125rem] font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      <Shield size={16} />
                      Admin Settings
                    </Link>
                  )}
                </div>

                <div className="pt-2">
                  <form action={logout}>
                    <button 
                      type="submit"
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-[0.8125rem] font-bold text-error hover:bg-error/5 transition-all"
                    >
                      <LogOut size={16} />
                      Log Out
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
