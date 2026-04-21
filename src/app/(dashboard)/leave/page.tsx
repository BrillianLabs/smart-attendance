import type { Metadata } from 'next';
import Link from 'next/link';
import { getMyLeaveRequests } from '@/lib/actions/leave';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = { title: 'Pengajuan Izin | SD Negeri Nguwok' };

const leaveTypeLabel: Record<string, string> = {
  sakit: 'Sakit (Medical)', izin: 'Izin (Personal)', cuti: 'Cuti (Annual)', dinas: 'Dinas Luar',
};

const leaveTypeIcon: Record<string, string> = {
  sakit: 'medical_services', izin: 'event_busy', cuti: 'beach_access', dinas: 'business_center',
};

export default async function LeavePage() {
  const leaves = await getMyLeaveRequests();

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-24">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">Management Portal</span>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Leave <span className="text-primary italic">&amp; History</span></h1>
          <p className="text-sm font-medium text-on-surface-variant opacity-60 mt-1">Review and track your attendance requests.</p>
        </div>
        <Link href="/leave/new">
          <button className="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Submit New Request
          </button>
        </Link>
      </section>

      {/* Main List Container */}
      <div className="bg-surface-container-lowest rounded-[2.5rem] p-4 shadow-sm shadow-primary/5 border border-outline-variant/10 overflow-hidden">
        {leaves.length === 0 ? (
          <div className="text-center py-24 px-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-surface-container-low rounded-[2rem] flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-outline/30">inbox</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2 tracking-tight">No requests found</h3>
            <p className="text-sm text-on-surface-variant mb-10 max-w-sm opacity-60 font-medium">Your request history is currently empty. Start by submitting a new absence notification.</p>
            <Link href="/leave/new">
              <button className="text-primary font-bold text-xs uppercase tracking-widest hover:underline decoration-primary/30 underline-offset-8">Create your first request</button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-surface-container-low">
            {leaves.map((leave) => (
              <div key={leave.id} className="p-6 lg:p-10 hover:bg-surface-container-low/30 transition-all rounded-[2.5rem] group border-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner border border-outline-variant/5">
                      <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {leaveTypeIcon[leave.leave_type] ?? 'description'}
                      </span>
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-lg font-bold tracking-tight text-on-surface">
                          {leaveTypeLabel[leave.leave_type] ?? leave.leave_type}
                        </p>
                        <Badge variant={statusVariant(leave.status)} className="px-5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all group-hover:shadow-md">
                          {statusLabel(leave.status)}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.1em] flex items-center gap-2 opacity-60">
                        <span className="material-symbols-outlined text-sm">event</span>
                        {format(parseISO(leave.start_date), 'd MMM', { locale: idLocale })}
                        {leave.start_date !== leave.end_date && (
                          <> – {format(parseISO(leave.end_date), 'd MMM yyyy', { locale: idLocale })}</>
                        )}
                        {leave.start_date === leave.end_date && (
                          <>, {format(parseISO(leave.start_date), 'yyyy', { locale: idLocale })}</>
                        )}
                      </p>
                      
                      <div className="mt-4 max-w-2xl">
                        <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2 italic opacity-80">
                          "{leave.reason}"
                        </p>
                      </div>

                      {leave.admin_note && (
                        <div className="mt-6 p-5 bg-surface-container-high/50 rounded-2xl border-l-[6px] border-primary flex items-start gap-4">
                          <span className="material-symbols-outlined text-primary text-lg mt-0.5">notification_important</span>
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Office Response</span>
                            <p className="text-[0.8125rem] font-medium text-on-surface-variant leading-relaxed">
                                {leave.admin_note}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2 self-center">
                    <span className="material-symbols-outlined text-outline/30 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <footer className="text-center opacity-30 mt-12 pb-8">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-on-surface">End of Archive</p>
      </footer>
    </div>
  );
}
