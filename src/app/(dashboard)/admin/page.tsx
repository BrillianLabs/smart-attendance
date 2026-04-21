import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getAdminStats, getSettings } from '@/lib/actions/admin';
import { getAdminAttendance, getMonthlyStats } from '@/lib/actions/attendance';
import { getAllLeaveRequests } from '@/lib/actions/leave';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = { title: 'Panel Admin | SD Negeri Nguwok' };

function MetricCard({ icon, label, value, trend, colorClass, barWidth, barColor }: {
  icon: string; label: string; value: number | string; trend: string; colorClass: string; barWidth: string; barColor: string;
}) {
  return (
    <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0px_12px_32px_rgba(42,52,57,0.04)] flex flex-col gap-4 relative overflow-hidden group border border-outline-variant/10">
      <div className="flex justify-between items-start">
        <div className={cn("p-3 rounded-xl", colorClass)}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <span className={cn("text-[11px] font-bold uppercase tracking-wider", barColor.replace('bg-', 'text-'))}>{trend}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-on-surface-variant opacity-70 mb-1">{label}</p>
        <h3 className="text-[3.5rem] font-bold text-on-background tracking-tighter leading-none">{value}</h3>
      </div>
      <div className="h-1.5 w-full bg-surface-container-low rounded-full mt-2">
        <div className={cn("h-full rounded-full transition-all duration-1000", barColor)} style={{ width: barWidth }}></div>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils/cn';

export default async function AdminDashboard() {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') redirect('/');

  const today = format(new Date(), 'yyyy-MM-dd');
  const [stats, todayAttendance, settings] = await Promise.all([
    getAdminStats(today),
    getAdminAttendance({ date: today, limit: 10 }),
    getSettings(),
  ]);

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      {/* Header Section */}
      <section className="flex justify-between items-end px-1">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">Academy Analytics</span>
          <h2 className="text-2xl sm:text-[2rem] font-bold text-on-surface leading-tight tracking-tight">Ringkasan Kehadiran Harian</h2>
        </div>
        <div className="hidden sm:flex gap-3">
          <button className="px-6 py-2.5 rounded-full text-xs font-bold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors">
            View History
          </button>
          <button className="px-6 py-2.5 rounded-full text-xs font-bold bg-gradient-to-br from-primary to-primary-dim text-white shadow-lg shadow-primary/10 active:scale-95 transition-all">
            New Registration
          </button>
        </div>
      </section>

      {/* Metrics Bento Grid - Matching Template */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricCard 
          icon="check_circle" 
          label="Total Hadir" 
          value={stats.hadir} 
          trend="+12% from avg" 
          colorClass="bg-primary-container text-on-primary-container"
          barWidth="85%"
          barColor="bg-primary"
        />
        <MetricCard 
          icon="schedule" 
          label="Terlambat" 
          value={stats.telat} 
          trend="-4% from avg" 
          colorClass="bg-secondary-container text-on-secondary-container"
          barWidth="15%"
          barColor="bg-secondary"
        />
        <MetricCard 
          icon="event_note" 
          label="Izin / Sakit" 
          value={stats.izin} 
          trend="+2 today" 
          colorClass="bg-error-container/20 text-error"
          barWidth="8%"
          barColor="bg-error"
        />
      </section>

      {/* Table Data Section - Matching Admin Template */}
      <section className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0px_12px_32px_rgba(42,52,57,0.04)] border border-outline-variant/10">
        <div className="px-8 py-6 flex justify-between items-center border-b border-surface-container-low">
          <h3 className="text-lg font-bold text-on-surface">Rekap Kehadiran Hari Ini</h3>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-surface-container-low rounded-lg p-1">
              <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md bg-white shadow-sm text-primary">All Students</button>
              <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md text-on-surface-variant opacity-60">Staff Only</button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Nama Mahasiswa</th>
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Jam Masuk</th>
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Jam Pulang</th>
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Status</th>
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {todayAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-outline/60 text-sm font-medium">No activity recorded today</td>
                </tr>
              ) : (
                todayAttendance.map((att) => (
                  <tr key={att.id} className="hover:bg-surface-container-low/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-low overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-primary shadow-inner">
                          {att.profiles?.avatar_url ? (
                            <Image src={att.profiles.avatar_url} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            att.profiles?.full_name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{att.profiles?.full_name}</p>
                          <p className="text-[10px] font-bold text-on-surface-variant opacity-50 uppercase tracking-wider">ID: {att.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-on-surface-variant font-medium">
                      {att.check_in ? format(parseISO(att.check_in), 'hh:mm a') : '--:--'}
                    </td>
                    <td className="px-8 py-5 text-sm text-on-surface-variant font-medium">
                      {att.check_out ? format(parseISO(att.check_out), 'hh:mm a') : '--:--'}
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant={statusVariant(att.status)} className="px-3 py-1 text-[10px] uppercase tracking-widest font-black rounded-full">
                        {statusLabel(att.status)}
                      </Badge>
                    </td>
                    <td className="px-8 py-5">
                      <button className="text-outline hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">more_horiz</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-6 border-t border-surface-container-low bg-white flex items-center justify-between">
          <p className="text-[11px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">
            Showing {todayAttendance.length} records
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-outline-variant/20 text-outline disabled:opacity-30" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20">1</button>
            <button className="p-2 rounded-lg border border-outline-variant/20 text-outline hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Attendance Ribbon (Bespoke Component from Template) */}
      <div className="fixed bottom-10 right-12 left-auto bg-white/60 backdrop-blur-xl px-7 py-5 rounded-full border border-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] flex items-center gap-8 max-w-2xl z-40 animate-fade-in translate-y-0 group hover:-translate-y-1 transition-all duration-300">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Real-time Feed</span>
          <span className="text-xs font-bold text-on-surface-variant">Live system activity</span>
        </div>
        <div className="w-[180px] h-2 bg-surface-container-highest rounded-full relative overflow-hidden hidden sm:block">
          <div className="absolute left-0 top-0 h-full w-[65%] bg-primary animate-pulse"></div>
        </div>
        <div className="flex -space-x-3">
          {[1,2,3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-high shadow-sm ring-1 ring-black/5" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live</span>
        </div>
      </div>
    </div>
  );
}
