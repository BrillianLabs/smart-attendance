'use client';

import { useState, useTransition } from 'react';
import { login } from '@/lib/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginFormProps {
  schoolName: string;
  logoUrl: string | null;
  primaryColor: string;
}

export function LoginForm({ schoolName, logoUrl, primaryColor }: LoginFormProps) {
  const [showPw, setShowPw]           = useState(false);
  const [isPending, startTransition]  = useTransition();
  const [error, setError]             = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await login(formData);
      if (!res.success) {
        setError(res.error);
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--surface-2)] to-[var(--primary-light)] p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="card p-8 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={`Logo ${schoolName}`}
                className="w-16 h-16 mx-auto mb-4 object-contain rounded-xl"
              />
            ) : (
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: primaryColor }}
              >
                <GraduationCap size={32} className="text-white" />
              </div>
            )}
            <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
              {schoolName}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Sistem Absensi Online</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              name="email"
              label="Email"
              required
              placeholder="email@sekolah.sch.id"
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input-field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[var(--danger-light)] text-sm text-[var(--danger)]">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={isPending}
              size="lg"
              className="w-full justify-center mt-2"
              style={{ background: primaryColor }}
            >
              Masuk
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          SisAbsen © {new Date().getFullYear()} — Sistem Absensi Sekolah
        </p>
      </div>
    </div>
  );
}
