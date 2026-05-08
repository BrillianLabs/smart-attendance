'use client';

import { useTransition, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { login, requestPasswordReset } from '@/lib/actions/auth';
import toast from 'react-hot-toast';

interface LoginFormProps {
  schoolName: string;
  logoUrl?: string | null;
}

export default function LoginForm({ schoolName, logoUrl }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      if (mode === 'login') {
        const result = await login(formData);
        if (result && !result.success) {
          setError(result.error || 'Terjadi kesalahan');
        } else {
          toast.success('Selamat datang kembali! 👋');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 800);
        }
      } else {
        const emailOrNip = formData.get('email') as string;
        const result = await requestPasswordReset(emailOrNip);
        if (result.success) {
          setResetSent(true);
          toast.success('Link reset password telah dikirim!');
        } else {
          setError(result.error);
        }
      }
    });
  }

  if (resetSent) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-geometric antialiased font-body">
        <div className="w-full max-w-[420px] text-center bg-surface-container-lowest rounded-[2.5rem] p-12 shadow-2xl border border-outline-variant/10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[40px] text-primary">mark_email_read</span>
          </div>
          <h2 className="text-2xl font-black text-on-surface mb-4">Cek Email Anda</h2>
          <p className="text-on-surface-variant text-sm font-medium leading-relaxed mb-8">
            Kami telah mengirimkan tautan untuk mengatur ulang kata sandi ke email Anda. Silakan periksa kotak masuk atau spam.
          </p>
          <button 
            onClick={() => { setResetSent(false); setMode('login'); }}
            className="w-full py-4 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container-highest transition-all"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-geometric antialiased font-body">
      <main className="w-full max-w-[420px] animate-fade-in">
        {/* Branding Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-[2.5rem] bg-surface-container-lowest shadow-2xl mb-6 overflow-hidden ring-4 ring-primary/10 mx-auto p-5 shrink-0">
            <Image 
              src={logoUrl || "/logo-256.webp"} 
              alt={schoolName} 
              width={256} 
              height={256}
              loading="eager"
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-headline text-[2.5rem] font-black tracking-tighter text-on-surface mb-0 leading-tight">
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'SIGAP'}
          </h1>
          <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
            ({process.env.NEXT_PUBLIC_APP_SUBTITLE ?? 'Sistem Informasi Guru Absensi Pintar'})
          </p>
          <div className="h-px w-8 bg-outline-variant/30 mx-auto mb-3"></div>
          <p className="text-on-surface-variant text-[0.75rem] font-black opacity-60 uppercase tracking-[0.05em]">
            {schoolName || 'SD NEGERI NGUWOK'}
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-surface-container-lowest rounded-[2.5rem] p-6 sm:p-10 lg:p-12 shadow-[0px_12px_32px_rgba(42,52,57,0.06)] border border-outline-variant/10">
          <div className="mb-8">
            <h2 className="text-xl font-black text-on-surface mb-1">
              {mode === 'login' ? 'Selamat Datang' : 'Lupa Password?'}
            </h2>
            <p className="text-xs font-bold text-on-surface-variant opacity-60">
              {mode === 'login' ? 'Silakan masuk ke akun Anda' : 'Masukkan Username/NIP untuk reset'}
            </p>
          </div>

          <form action={handleSubmit} className="space-y-6">
            {/* Email Input Group */}
            <div className="space-y-2">
              <label 
                className="block text-[11px] font-bold uppercase tracking-[0.05rem] text-on-surface-variant ml-1" 
                htmlFor="email"
              >
                Username / NIP
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline opacity-60">
                  <span className="material-symbols-outlined text-[20px]">{mode === 'login' ? 'person' : 'mail'}</span>
                </div>
                <input 
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl text-on-surface text-[0.875rem] focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 placeholder:text-outline/40" 
                  id="email" 
                  name="email" 
                  placeholder={mode === 'login' ? "Contoh: 19850504..." : "NIP atau Email Anda"} 
                  autoComplete="username"
                  required 
                  type="text" 
                />
              </div>
            </div>

            {/* Password Input Group (Hanya saat login) */}
            {mode === 'login' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label 
                    className="block text-[11px] font-bold uppercase tracking-[0.05rem] text-on-surface-variant" 
                    htmlFor="password"
                  >
                    Kata Sandi
                  </label>
                  <button 
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] font-bold text-primary hover:text-primary-dim transition-colors"
                  >
                    Lupa?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline opacity-60">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input 
                    className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border-none rounded-xl text-on-surface text-[0.875rem] focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 placeholder:text-outline/40" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    autoComplete="current-password"
                    required 
                    type={showPw ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPw ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="animate-shake p-3 rounded-xl bg-error-container/10 border border-error-container/20 text-error text-xs font-semibold text-center mt-2">
                {error}
              </div>
            )}

            {/* Action Button */}
            <button 
              disabled={isPending}
              className="w-full py-4 bg-gradient-to-br from-primary to-primary-dim text-white font-bold rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70" 
              type="submit"
            >
              <span className="text-[0.9375rem]">
                {isPending ? 'Memproses...' : (mode === 'login' ? 'Masuk' : 'Kirim Link Reset')}
              </span>
              {!isPending && (
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  {mode === 'login' ? 'arrow_forward' : 'send'}
                </span>
              )}
            </button>

            {mode === 'forgot' && (
              <button 
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-[0.8125rem] font-bold text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity"
              >
                Kembali ke Login
              </button>
            )}
          </form>

          {/* Secondary Action */}
          <div className="mt-8 text-center border-t border-outline-variant/10 pt-8">
            <p className="text-[0.8125rem] text-on-surface-variant">
              Belum punya akun? 
              <a className="text-primary font-bold hover:underline underline-offset-4 decoration-primary/30 ml-1" href="#">
                Hubungi Administrator
              </a>
            </p>
          </div>
        </div>

        {/* Footer Meta */}
        <footer className="mt-12 text-center text-outline/50 text-[0.6875rem] font-bold uppercase tracking-[0.1em] flex flex-wrap items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} {schoolName || 'SD NEGERI NGUWOK KECAMATAN MODO'}</span>
          <span className="w-1 h-1 rounded-full bg-outline/20 hidden sm:block"></span>
          <a className="hover:text-on-surface transition-colors" href="#">Kebijakan Privasi</a>
          <span className="w-1 h-1 rounded-full bg-outline/20 hidden sm:block"></span>
          <a className="hover:text-on-surface transition-colors" href="#">Syarat & Ketentuan</a>
        </footer>
      </main>

      {/* Decorative Corner Accents from Template */}
      <div className="fixed top-0 right-0 p-12 pointer-events-none opacity-20 hidden lg:block">
        <div className="w-64 h-64 border-[40px] border-primary-container/20 rounded-full"></div>
      </div>
      <div className="fixed bottom-0 left-0 p-12 pointer-events-none opacity-20 hidden lg:block">
        <div className="w-48 h-48 bg-primary-container/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
