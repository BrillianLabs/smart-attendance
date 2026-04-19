'use client';

import { useState, useTransition } from 'react';
import { updateSettings, uploadLogo } from '@/lib/actions/admin';
import { Settings } from '@/lib/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, Upload, MapPin, Clock, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
        toast.success('Pengaturan berhasil disimpan!');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.set('logo', file);
    startTransition(async () => {
      const res = await uploadLogo(formData);
      if (res.success) {
        toast.success('Logo berhasil diunggah!');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Kustomisasi Sekolah */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Sekolah</CardTitle>
        </CardHeader>
        <div className="space-y-5">
          {/* Logo upload */}
          <div>
            <label className="block mb-2">Logo Sekolah</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden bg-[var(--surface-2)]">
                {logoPreview ? (
                  <Image src={logoPreview} alt="Logo" width={64} height={64} className="object-contain" />
                ) : (
                  <Upload size={24} className="text-[var(--text-muted)]" />
                )}
              </div>
              <div>
                <label
                  htmlFor="logo-upload"
                  className="btn btn-secondary btn-sm cursor-pointer inline-flex gap-2"
                >
                  <Upload size={14} />
                  Pilih Gambar
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={isPending}
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">PNG, JPG, SVG. Maks 2MB.</p>
              </div>
            </div>
          </div>

          <Input
            name="school_name"
            label="Nama Sekolah"
            required
            defaultValue={initial?.school_name ?? 'SMA Negeri 1 Contoh'}
            placeholder="Nama sekolah Anda"
          />

          <div>
            <label className="block mb-2 flex items-center gap-2">
              <Palette size={15} className="text-[var(--text-muted)]" />
              Warna Tema
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="primary_color"
                defaultValue={initial?.primary_color ?? '#2563EB'}
                className="w-12 h-10 rounded cursor-pointer border border-[var(--border)] p-1"
              />
              <p className="text-sm text-[var(--text-muted)]">
                Warna ini digunakan pada sidebar, tombol, dan elemen aktif.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Lokasi GPS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={16} className="text-[var(--danger)]" />
            Lokasi Sekolah (GPS)
          </CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-[var(--info-light)] text-sm text-[var(--info)]">
            💡 Dapatkan koordinat dari Google Maps: klik kanan lokasi → salin koordinat.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="number"
              name="school_lat"
              label="Latitude"
              step="any"
              required
              defaultValue={initial?.school_lat ?? -6.2088}
              placeholder="-6.2088"
            />
            <Input
              type="number"
              name="school_lng"
              label="Longitude"
              step="any"
              required
              defaultValue={initial?.school_lng ?? 106.8456}
              placeholder="106.8456"
            />
          </div>
          <Input
            type="number"
            name="allowed_radius_m"
            label="Radius Absensi (meter)"
            required
            defaultValue={initial?.allowed_radius_m ?? 100}
            hint="Jarak maksimal dari lokasi sekolah untuk bisa absen."
          />
        </div>
      </Card>

      {/* Jam Kerja */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={16} className="text-[var(--primary)]" />
            Jam Kerja
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="time"
            name="work_start_time"
            label="Jam Masuk"
            required
            defaultValue={initial?.work_start_time ?? '07:30'}
            hint="Lebih dari jam ini = Terlambat"
          />
          <Input
            type="time"
            name="work_end_time"
            label="Jam Pulang"
            required
            defaultValue={initial?.work_end_time ?? '15:00'}
          />
        </div>
      </Card>

      <Button type="submit" loading={isPending} size="lg" className="w-full justify-center">
        <Save size={18} />
        Simpan Pengaturan
      </Button>
    </form>
  );
}
