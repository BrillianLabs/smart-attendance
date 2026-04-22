'use client';

import { useState, useTransition, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from '@/lib/actions/auth';
import { toast } from 'react-hot-toast';

function ResetPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm_password') as string;

    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    startTransition(async () => {
      const result = await updatePassword(password);
      if (result.success) {
        toast.success('Password berhasil diperbarui! Silakan login.');
        router.push('/login');
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="bg-surface-container-lowest rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-outline-variant/10">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-[40px] text-primary">lock_reset</span>
        </div>
        <h1 className="text-2xl font-black text-on-surface tracking-tight mb-2">Setel Ulang Password</h1>
        <p className="text-xs font-bold text-on-surface-variant opacity-60">Silakan masukkan password baru Anda</p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-[0.05rem] text-on-surface-variant ml-1">
            Password Baru
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline opacity-60">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <input 
              className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border-none rounded-xl text-on-surface text-[0.875rem] focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200" 
              name="password" 
              type={showPw ? 'text' : 'password'}
              placeholder="Minimal 6 karakter"
              required 
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

        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-[0.05rem] text-on-surface-variant ml-1">
            Konfirmasi Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline opacity-60">
              <span className="material-symbols-outlined text-[20px]">lock_clock</span>
            </div>
            <input 
              className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl text-on-surface text-[0.875rem] focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200" 
              name="confirm_password" 
              type="password"
              placeholder="Ulangi password baru"
              required 
            />
          </div>
        </div>

        {error && (
          <div className="animate-shake p-3 rounded-xl bg-error-container/10 border border-error-container/20 text-error text-xs font-semibold text-center mt-2">
            {error}
          </div>
        )}

        <button 
          disabled={isPending}
          className="w-full py-4 bg-gradient-to-br from-primary to-primary-dim text-white font-bold rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70" 
          type="submit"
        >
          <span className="text-[0.9375rem]">{isPending ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
          {!isPending && (
            <span className="material-symbols-outlined text-[18px] group-hover:translate-y-[-2px] transition-transform">
              check_circle
            </span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-geometric antialiased font-body">
      <main className="w-full max-w-[420px] animate-fade-in">
        <Suspense fallback={<div className="text-center font-bold text-on-surface">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
