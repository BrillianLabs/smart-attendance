'use client';

import { useState, useTransition } from 'react';
import { updateSettings, uploadLogo } from '@/lib/actions/admin';
import { Settings } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export function SettingsForm({ initial }: { initial: Settings | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [logoPreview, setLogoPreview] = useState<string | null>(initial?.school_logo_url ?? null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateSettings(formData);
      if (res.success) {
        toast.success('Pengaturan sistem berhasil diperbarui! ⚙️');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.set('logo', file);
    startTransition(async () => {
      const res = await uploadLogo(formData);
      if (res.success) {
        toast.success('Logo institusi diperbarui! 🖼️');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-10 animate-fade-in max-w-4xl mx-auto pb-24">
      {/* Institusi & Branding */}
      <section className="bg-surface-container-lowest p-8 lg:p-10 rounded-[2.5rem] shadow-sm shadow-primary/5 border border-outline-variant/10">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">apartment</span>
           </div>
           <h3 className="text-xl font-bold text-on-surface">Institutional Branding</h3>
        </div>
        
        <div className="space-y-8">
          {/* Logo upload Tonal Widget */}
          <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1 mb-4 block">Academy Emblem</label>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-2xl border border-outline-variant/10 flex items-center justify-center overflow-hidden bg-white shadow-inner p-1">
                {logoPreview ? (
                  <Image src={logoPreview} alt="Logo" width={96} height={96} className="w-full h-full object-contain" />
                ) : (
                  <span className="material-symbols-outlined text-outline/30 text-4xl">add_photo_alternate</span>
                )}
              </div>
              <div className="flex flex-col gap-3 items-center sm:items-start">
                <label
                  htmlFor="logo-upload"
                  className="btn btn-secondary btn-sm ring-1 ring-outline-variant/10"
                >
                  Upload New Emblem
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={isPending}
                />
                <p className="text-[10px] font-medium text-on-surface-variant opacity-50 italic">PNG, JPG, or SVG. Maximum file size 2MB.</p>
              </div>
            </div>
          </div>

          <Input
            name="school_name"
            label="Academy Name"
            required
            defaultValue={initial?.school_name ?? 'SD NEGERI NGUWOK KECAMATAN MODO'}
            placeholder="Official institutional name"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60 ml-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">palette</span>
                  Core Interface Color
                </label>
                <div className="flex items-center gap-4 bg-surface-container-low p-3 rounded-2xl border border-outline-variant/5">
                  <input
                    type="color"
                    name="primary_color"
                    defaultValue={initial?.primary_color ?? '#006a61'}
                    className="w-12 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                  />
                  <p className="text-[11px] font-medium text-on-surface-variant opacity-70">
                    Defines the palette for primary buttons and active indicators.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Geolocation Controls */}
      <section className="bg-surface-container-low p-8 lg:p-10 rounded-[2.5rem] border border-outline-variant/10">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 rounded-xl bg-error-container/20 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">distance</span>
           </div>
           <h3 className="text-xl font-bold text-on-surface">Precision Geofencing</h3>
        </div>

        <div className="space-y-8">
          <div className="p-5 bg-surface-container-high/40 rounded-2xl border border-outline-variant/10 shadow-sm text-xs font-medium text-on-surface-variant leading-relaxed">
            <span className="font-bold text-primary italic mr-2">Digital Boundary:</span>
            Specify the precise GPS coordinates and radius for student/staff verification. Use Google Maps to verify the exact "Atelier Area".
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Input
              type="number"
              name="school_lat"
              label="Centroid Latitude"
              step="any"
              required
              defaultValue={initial?.school_lat ?? -6.2088}
              placeholder="-6.2088"
            />
            <Input
              type="number"
              name="school_lng"
              label="Centroid Longitude"
              step="any"
              required
              defaultValue={initial?.school_lng ?? 106.8456}
              placeholder="106.8456"
            />
          </div>
          <Input
            type="number"
            name="allowed_radius_m"
            label="Verification Radius (meters)"
            required
            defaultValue={initial?.allowed_radius_m ?? 100}
            hint="Maximum allowable distance from the academy centroid for biometric check-in."
          />
        </div>
      </section>

      {/* Work Schedule */}
      <section className="bg-surface-container-lowest p-8 lg:p-10 rounded-[2.5rem] shadow-sm shadow-primary/5 border border-outline-variant/10">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined">schedule</span>
           </div>
           <h3 className="text-xl font-bold text-on-surface">Standard Working Hours</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <Input
            type="time"
            name="work_start_time"
            label="Daily Start Time (Check-In)"
            required
            defaultValue={initial?.work_start_time ?? '07:30'}
            hint="Late threshold begins at this index."
          />
          <Input
            type="time"
            name="work_end_time"
            label="Daily End Time (Checkout)"
            required
            defaultValue={initial?.work_end_time ?? '15:00'}
          />
        </div>
      </section>

      {/* Global Action Button */}
      <div className="pt-6">
        <button 
          type="submit" 
          disabled={isPending}
          className="w-full py-5 bg-gradient-to-br from-primary to-primary-dim text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 ring-1 ring-white/10"
        >
          {isPending ? 'Syncing...' : 'Commit Settings'}
          <span className="material-symbols-outlined text-lg">save</span>
        </button>
      </div>
    </form>
  );
}
