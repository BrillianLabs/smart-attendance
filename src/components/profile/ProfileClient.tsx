'use client';

import { useState, useTransition } from 'react';
import { Profile } from '@/lib/types';
import { updateProfileMetadata, updateProfileAvatar } from '@/lib/actions/profile';
import { compressImage } from '@/lib/utils/image';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { Camera, Save, User, UserCircle, Briefcase, Phone, Loader2, Webcam } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/Input';
import dynamic from 'next/dynamic';

// face-api.js is ~5MB — lazy load, only needed when capture button is clicked
const FaceCamera = dynamic(
  () => import('@/components/attendance/FaceCamera').then(m => ({ default: m.FaceCamera })),
  { ssr: false }
);

interface ProfileClientProps {
  profile: Profile;
}

export function ProfileClient({ profile }: ProfileClientProps) {
  const [isPending, startTransition] = useTransition();
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleMetadataUpdate = async (formData: FormData) => {
    startTransition(async () => {
      const res = await updateProfileMetadata(formData);
      if (res.success) {
        toast.success('Profil berhasil diperbarui!');
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loading = toast.loading('Mengompres & Mengunggah foto...');
    
    try {
      // Compress client-side to 512px WebP
      const compressedFile = await compressImage(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.8
      });

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        startTransition(async () => {
          const res = await updateProfileAvatar(base64);
          toast.dismiss(loading);
          if (res.success) {
            setAvatar(res.data);
            toast.success('Foto profil diperbarui!');
          } else {
            toast.error(res.error);
          }
        });
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      toast.dismiss(loading);
      toast.error('Gagal memproses gambar.');
      console.error(err);
    }
  };

  const handleCameraCapture = async (base64: string) => {
    setIsCameraOpen(false);
    const loading = toast.loading('Memproses foto...');
    
    startTransition(async () => {
      const res = await updateProfileAvatar(base64);
      toast.dismiss(loading);
      if (res.success) {
        setAvatar(res.data);
        toast.success('Foto profil berhasil diperbarui!');
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {isCameraOpen && (
        <FaceCamera 
          mode="capture"
          onVerified={handleCameraCapture}
          onCancel={() => setIsCameraOpen(false)}
        />
      )}
      {/* Header Profile */}
      <div className="relative group">
        <div className="h-48 rounded-[2.5rem] bg-gradient-to-r from-primary to-primary-dim shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 mask-pattern-dots"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="px-8 -mt-16 relative flex flex-col md:flex-row items-end gap-6">
          <div className="relative group/avatar">
            <div className="w-32 h-32 rounded-[2rem] bg-surface-container-lowest p-1.5 shadow-2xl relative overflow-hidden ring-4 ring-surface-container-lowest">
              {avatar ? (
                <Image src={avatar} alt={profile.full_name} width={128} height={128} className="w-full h-full object-cover rounded-[1.75rem]" />
              ) : (
                <div className="w-full h-full bg-primary-container text-primary flex items-center justify-center text-4xl font-black rounded-[1.75rem]">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                <Camera className="text-white" size={32} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isPending} />
              </label>
            </div>
            {isPending && (
              <div className="absolute inset-x-0 bottom-0 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-widest text-center rounded-b-[2rem] animate-pulse">
                Uploading...
              </div>
            )}
          </div>

          <div className="flex-1 mb-2">
            <h1 className="text-3xl font-black text-on-surface tracking-tight">{profile.full_name}</h1>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                <Briefcase size={12} />
                {profile.position || 'Staff'}
              </span>
              <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                <UserCircle size={12} />
                {profile.role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info Form */}
        <div className="lg:col-span-2">
          <div className="bg-surface-container-lowest rounded-[2.5rem] p-10 border border-outline-variant/10 shadow-sm">
            <h3 className="text-xl font-black text-on-surface flex items-center gap-3 mb-8">
              <User className="text-primary" size={24} />
              Informasi Personal
            </h3>

            <form action={handleMetadataUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1 flex items-center gap-2">
                   <UserCircle size={14} className="text-primary" />
                   Nama Lengkap
                </label>
                <input 
                  name="full_name"
                  defaultValue={profile.full_name}
                  required
                  placeholder="Masukkan nama lengkap"
                  className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-on-surface"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1 flex items-center gap-2">
                   <Briefcase size={14} className="text-primary" />
                   Jabatan / Posisi
                </label>
                <input 
                  name="position"
                  defaultValue={profile.position || ''}
                  placeholder="Contoh: Guru Matematika"
                  className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-on-surface"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1 flex items-center gap-2">
                   <Phone size={14} className="text-primary" />
                   Nomor Telepon
                </label>
                <input 
                  name="phone"
                  defaultValue={profile.phone || ''}
                  placeholder="0812..."
                  className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-on-surface"
                />
              </div>

              <div className="md:col-span-2 pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={isPending}
                  className="px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px] hover:shadow-xl active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 flex items-center gap-2"
                >
                  {isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* AI Face Reference Note */}
        <div className="lg:col-span-1 space-y-6">
          <div className={cn(
             "rounded-[2.5rem] p-8 border transition-all",
             profile.avatar_url 
               ? "bg-primary/5 border-primary/20" 
               : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/20"
          )}>
            <div className="flex items-center gap-4 mb-4">
               <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                  profile.avatar_url ? "bg-primary/10 text-primary" : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
               )}>
                  <Camera size={24} />
               </div>
               <h4 className="text-sm font-black text-on-surface tracking-tight uppercase">ID Wajah AI</h4>
            </div>
            
            <p className={cn(
              "text-xs font-bold leading-relaxed opacity-70",
              !profile.avatar_url && "text-amber-900 dark:text-amber-200"
            )}>
              {profile.avatar_url 
                ? "Foto profil Anda sudah terdaftar. Sistem AI akan menggunakan foto ini untuk verifikasi kehadiran setiap hari."
                : "Foto profil Anda belum terdaftar. Harap unggah foto wajah yang jelas agar sistem AI dapat memverifikasi kehadiran Anda."
              }
            </p>

            <div className="mt-6 flex flex-col gap-3">
               <button 
                  onClick={() => setIsCameraOpen(true)}
                  className="btn btn-primary w-full"
               >
                  <Webcam size={16} />
                  Ambil Foto Langsung
               </button>
               <label className="btn btn-secondary w-full ring-1 ring-outline-variant/5">
                  <Camera size={16} />
                  Unggah dari Berkas
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
               </label>
            </div>
            
            <ul className="mt-6 space-y-3">
               {[
                 "Wajah harus terlihat jelas",
                 "Tidak menggunakan masker",
                 "Pencahayaan yang cukup"
               ].map((tip, i) => (
                 <li key={i} className="flex items-center gap-2 text-[10px] font-bold opacity-60">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {tip}
                 </li>
               ))}
            </ul>
          </div>

          {/* Change Password Card */}
          <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-outline-variant/10">
             <h4 className="text-sm font-black text-on-surface tracking-tight uppercase mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">lock_reset</span>
                Ganti Kata Sandi
             </h4>
             
             <form action={(formData) => {
                const pass = formData.get('new_password') as string;
                const conf = formData.get('confirm_password') as string;
                if (pass !== conf) {
                  toast.error('Konfirmasi password tidak cocok');
                  return;
                }
                startTransition(async () => {
                  const res = await import('@/lib/actions/auth').then(m => m.updatePassword(pass));
                  if (res.success) {
                    toast.success('Password berhasil diperbarui');
                    (document.getElementById('change-pw-form') as HTMLFormElement)?.reset();
                  } else {
                    toast.error(res.error);
                  }
                });
             }} id="change-pw-form" className="space-y-4">
                <Input 
                   name="new_password"
                   type="password"
                   label="Password Baru"
                   required
                   placeholder="Minimal 6 karakter"
                   className="bg-surface-container-lowest"
                />
                <Input 
                   name="confirm_password"
                   type="password"
                   label="Konfirmasi Password"
                   required
                   placeholder="Ulangi password baru"
                   className="bg-surface-container-lowest"
                />
                <button 
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 bg-on-surface text-surface rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? 'Memproses...' : 'Update Password'}
                </button>
             </form>
             
             <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
                <div className="px-4 py-1.5 bg-surface-container-lowest/80 rounded-lg text-[9px] font-black uppercase tracking-widest border border-outline-variant/10 inline-block text-on-surface opacity-50">
                   v1.2.4 SECURE
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
