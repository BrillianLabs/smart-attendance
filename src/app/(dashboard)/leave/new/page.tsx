'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitLeave } from '@/lib/actions/leave';
import { Input, Select, Textarea } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { formatWIB } from '@/lib/utils/date';
import Link from 'next/link';

export default function NewLeavePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = formatWIB(new Date(), 'yyyy-MM-dd');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitLeave(formData);
      if (res.success) {
        toast.success('Pengajuan berhasil dikirim! 📩');
        router.push('/leave');
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in px-4 pb-24">
      <div className="bg-surface-container-lowest rounded-[2.5rem] shadow-2xl shadow-primary/5 overflow-hidden flex flex-col md:flex-row border border-outline-variant/10">
        
        {/* Left Column: Asymmetrical Branding & Status Tracker */}
        <div className="md:w-5/12 bg-surface-container-low p-8 sm:p-10 lg:p-14 flex flex-col justify-between border-r border-outline-variant/10">
          <div>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 md:mb-10 shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-white text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-on-surface leading-[1.1] mb-4 md:mb-6 tracking-tight">
              Ajukan <span className="text-primary italic">Izin</span>
            </h2>
            <p className="text-sm font-medium text-on-surface-variant leading-relaxed opacity-70">
              Lengkapi formulir untuk mengajukan izin akademik atau keperluan pribadi.
            </p>
          </div>

          <div className="mt-10 md:mt-16 space-y-8 md:space-y-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mb-4 md:mb-5 block">Tahapan Pengajuan</span>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/10"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary">Pengisian Formulir</span>
                    <span className="text-[9px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest mt-0.5">Langkah 1 dari 3</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 opacity-40">
                  <div className="w-3 h-3 rounded-full bg-outline"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Antrean Peninjauan</span>
                    <span className="text-[9px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest mt-0.5">Fase Verifikasi</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-surface-container-high/40 rounded-3xl border border-outline-variant/10 shadow-sm">
               <div className="flex items-center gap-2 mb-2 text-primary">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <p className="text-[10px] font-black uppercase tracking-wider">Panduan</p>
               </div>
               <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium">
                  Pastikan dokumen pendukung (seperti surat dokter) sudah siap jika diperlukan. Berikan alasan yang jelas untuk memudahkan peninjauan admin.
               </p>
            </div>
          </div>
        </div>

        {/* Right Column: Elaborate FormSection */}
        <div className="md:w-7/12 p-8 lg:p-16">
          <form onSubmit={handleSubmit} className="space-y-10">
            <Select name="leave_type" label="Tipe Pengajuan" required>
              <option value="">Pilih kategori...</option>
              <option value="sakit">Sakit (Medical Leave)</option>
              <option value="izin">Izin Kepentingan (Personal Leave)</option>
              <option value="cuti">Cuti Tahunan (Annual Leave)</option>
              <option value="dinas">Dinas Luar (Duty Travel)</option>
            </Select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <Input
                type="date"
                name="start_date"
                label="Tanggal Mulai"
                required
                min={today}
                defaultValue={today}
              />
              <Input
                type="date"
                name="end_date"
                label="Tanggal Selesai"
                required
                min={today}
                defaultValue={today}
              />
            </div>

            <Textarea
              name="reason"
              label="Alasan Detail (Justifikasi)"
              required
              placeholder="Berikan alasan lengkap mengenai pengajuan izin Anda..."
              rows={4}
            />

            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-[0.05rem] text-on-surface-variant ml-1 opacity-70">
                Dokumen Pendukung (Opsional)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline opacity-60">
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                </div>
                <input 
                  type="file"
                  name="attachment"
                  accept=".jpg,.jpeg,.pdf"
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-2 border-dashed border-outline-variant/30 rounded-2xl text-on-surface text-[0.875rem] file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer" 
                />
              </div>
              <p className="text-[10px] font-bold text-on-surface-variant opacity-50 ml-1 italic">
                * Format: JPG, PDF (Maks 2MB)
              </p>
            </div>

            <div className="pt-10 flex flex-col sm:flex-row items-center justify-end gap-6 border-t border-outline-variant/10">
              <Link href="/leave" className="w-full sm:w-auto">
                <button type="button" className="w-full px-8 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                  Batal
                </button>
              </Link>
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full sm:w-auto px-12 py-5 bg-gradient-to-br from-primary to-primary-dim text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/20 active:scale-95 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale ring-1 ring-white/10"
              >
                {isPending ? 'Memproses...' : 'Kirim Pengajuan'}
              </button>
            </div>
          </form>

          <footer className="mt-20 text-center opacity-20">
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-on-surface">SD NEGERI NGUWOK</p>
          </footer>
        </div>

      </div>
    </div>
  );
}
