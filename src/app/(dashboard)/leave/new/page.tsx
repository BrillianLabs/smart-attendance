'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitLeave } from '@/lib/actions/leave';
import { Input, Select, Textarea } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Link from 'next/link';

export default function NewLeavePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = format(new Date(), 'yyyy-MM-dd');

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
        <div className="md:w-5/12 bg-surface-container-low p-10 lg:p-14 flex flex-col justify-between border-r border-outline-variant/10">
          <div>
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-10 shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
            </div>
            <h2 className="text-4xl font-black text-on-surface leading-[1.1] mb-6 tracking-tight">
              Request <span className="text-primary italic">Leave</span>
            </h2>
            <p className="text-sm font-medium text-on-surface-variant leading-relaxed opacity-70">
              Complete the form to request academic leave or personal absence. Requests are reviewed by administrators within 24 hours.
            </p>
          </div>

          <div className="mt-16 space-y-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mb-5 block">Journey Tracking</span>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/10"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary">Form Submission</span>
                    <span className="text-[9px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest mt-0.5">Step 1 of 3</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 opacity-40">
                  <div className="w-3 h-3 rounded-full bg-outline"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Queue for Review</span>
                    <span className="text-[9px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest mt-0.5">Verification Phase</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white/40 rounded-3xl border border-white/60 shadow-sm">
               <div className="flex items-center gap-2 mb-2 text-primary">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <p className="text-[10px] font-black uppercase tracking-wider">Guidelines</p>
               </div>
               <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium">
                  Ensure all medical documents are attached if requesting sick leave. Provide a clear and concise reason for administrative review.
               </p>
            </div>
          </div>
        </div>

        {/* Right Column: Elaborate FormSection */}
        <div className="md:w-7/12 p-8 lg:p-16">
          <form onSubmit={handleSubmit} className="space-y-10">
            <Select name="leave_type" label="Tipe Pengajuan" required>
              <option value="">Select a category...</option>
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
              label="Alasan Detail (Justification)"
              required
              placeholder="Please provide a comprehensive explanation for your absence..."
              rows={6}
            />

            <div className="pt-10 flex flex-col sm:flex-row items-center justify-end gap-6 border-t border-outline-variant/10">
              <Link href="/leave" className="w-full sm:w-auto">
                <button type="button" className="w-full px-8 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                  Cancel
                </button>
              </Link>
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full sm:w-auto px-12 py-5 bg-gradient-to-br from-primary to-primary-dim text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/20 active:scale-95 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale ring-1 ring-white/10"
              >
                {isPending ? 'Processing...' : 'Submit Request'}
              </button>
            </div>
          </form>

          <footer className="mt-20 text-center opacity-20">
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-on-surface">Atelier Academy Admin</p>
          </footer>
        </div>

      </div>
    </div>
  );
}
