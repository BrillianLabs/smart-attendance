import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getAllLeaveRequests } from '@/lib/actions/leave';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { LeaveReviewButtons } from '@/components/admin/LeaveReviewButtons';
import { formatWIB } from '@/lib/utils/date';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = { title: 'Persetujuan Izin | SD Negeri Nguwok' };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminLeavePage({ searchParams }: Props) {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') redirect('/');

  const params = await searchParams;
  const status = (params.status as any) ?? undefined;
  const leaves = await getAllLeaveRequests(status);

  return (
    <div className="space-y-10 animate-fade-in pb-24">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">Pusat Keputusan</span>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Persetujuan <span className="text-primary italic">Izin</span></h1>
          <p className="text-sm font-medium text-on-surface-variant opacity-60">Mengelola {leaves.length} pengajuan yang menunggu dan arsip.</p>
        </div>
      </section>

      {/* Filter Tabs - Tonal Pill Design */}
      <div className="nav-tab-container">
        {[
          { key: '', label: 'Semua Indeks' },
          { key: 'pending', label: 'Menunggu' },
          { key: 'approved', label: 'Disetujui' },
          { key: 'rejected', label: 'Ditolak' }
        ].map(s => (
          <Link
            key={s.key}
            href={s.key ? `/admin/leave?status=${s.key}` : '/admin/leave'}
            className={cn(
               "nav-tab-item",
               (status ?? '') === s.key && "nav-tab-item-active"
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-surface-container-lowest rounded-[2.5rem] shadow-sm shadow-primary/5 border border-outline-variant/10 overflow-hidden">
        {leaves.length === 0 ? (
          <div className="text-center py-20">
             <span className="material-symbols-outlined text-4xl text-outline/20 mb-3 block">mark_email_read</span>
             <p className="text-xs font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">Tidak ada pengajuan yang sesuai filter</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-container-low">
            {leaves.map(leave => (
              <div key={leave.id} className="p-8 lg:p-10 hover:bg-surface-container-low/30 transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-full bg-surface-container-low overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-primary border border-outline-variant/5">
                      {leave.profiles?.avatar_url ? (
                        <Image src={leave.profiles.avatar_url} alt="Profile" width={56} height={56} className="w-full h-full object-cover" />
                      ) : (
                        (leave.profiles?.full_name ?? 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="space-y-1.5 min-w-0">
                       <div className="flex items-center gap-3">
                          <p className="text-lg font-bold text-on-surface">{leave.profiles?.full_name ?? 'Anggota Tidak Dikenal'}</p>
                          <Badge variant="gray" className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest opacity-60">
                            {leave.leave_type}
                          </Badge>
                       </div>
                       <p className="text-[10px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">
                          {leave.profiles?.position ?? 'Anggota Institusi'} • {formatWIB(leave.start_date, 'd MMM')}
                          {leave.start_date !== leave.end_date && (
                            <> – {formatWIB(leave.end_date, 'd MMM yyyy')}</>
                          )}
                          {leave.start_date === leave.end_date && (
                            <>, {formatWIB(leave.start_date, 'yyyy')}</>
                          )}
                       </p>
                       <div className="mt-4 p-5 bg-surface rounded-2xl border border-outline-variant/10 italic text-sm text-on-surface-variant leading-relaxed max-w-2xl relative group/reason">
                          "{leave.reason}"
                          {leave.attachment_url && (
                            <div className="mt-4 pt-4 border-t border-outline-variant/5">
                               <a 
                                 href={leave.attachment_url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-primary hover:text-white shadow-sm"
                               >
                                 <span className="material-symbols-outlined text-[18px]">visibility</span>
                                 Dokumen Pendukung
                               </a>
                            </div>
                          )}
                       </div>
                       {leave.admin_note && (
                        <p className="text-[11px] font-medium text-primary mt-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">sticky_note_2</span>
                          Catatan Resmi: {leave.admin_note}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 shrink-0 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 mt-4 lg:mt-0">
                    <Badge variant={statusVariant(leave.status)} className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                      {statusLabel(leave.status)}
                    </Badge>
                    {leave.status === 'pending' && (
                      <div className="animate-slide-in">
                        <LeaveReviewButtons leaveId={leave.id} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
