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
import { cn } from '@/lib/utils/cn';
import { ExportButton } from '@/components/admin/ExportButton';

export const metadata: Metadata = { title: 'Panel Admin | SIGAP' };

function MetricCard({ icon, label, value, trend, colorClass, barWidth, barColor }: {
  icon: string; label: string; value: number | string; trend: string; colorClass: string; barWidth: string; barColor: string;
}) {
  return (
    <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-[0px_12px_32px_rgba(42,52,57,0.04)] dark:shadow-none flex flex-col gap-4 relative overflow-hidden group border border-outline-variant/10">
      <div className="flex justify-between items-start">
        <div className={cn("p-3 rounded-xl", colorClass)}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <span className={cn("text-[11px] font-bold uppercase tracking-wider", barColor.replace('bg-', 'text-'))}>{trend}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-on-surface-variant opacity-70 mb-1">{label}</p>
        <h3 className="text-4xl sm:text-[3.5rem] font-bold text-on-background tracking-tighter leading-none">{value}</h3>
      </div>
      <div className="h-1.5 w-full bg-surface-container-low rounded-full mt-2">
        <div className={cn("h-full rounded-full transition-all duration-1000", barColor)} style={{ width: barWidth }}></div>
      </div>
    </div>
  );
}

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
    <div className="space-y-8 sm:space-y-12 animate-fade-in pb-24">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-primary mb-3 block opacity-80">Pengalaman Manajemen</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-on-surface tracking-tight leading-none mb-2">
            Selamat Datang di <span className="text-primary italic">SIGAP</span>
          </h1>
          <p className="text-sm font-medium text-on-surface-variant opacity-60">
            Sistem Informasi Guru Absensi Pintar — SD NEGERI NGUWOK
          </p>
        </div>
        <div className="hidden sm:flex gap-4">
          <button className="btn btn-secondary btn-sm ring-1 ring-outline-variant/5">
            Riwayat
          </button>
          <button className="btn btn-primary btn-sm">
            Registrasi Baru
          </button>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <MetricCard 
          icon="check_circle" 
          label="Total Hadir" 
          value={stats.hadir} 
          trend="+12% dari rata-rata" 
          colorClass="bg-primary-container text-on-primary-container"
          barWidth="85%"
          barColor="bg-primary"
        />
        <MetricCard 
          icon="schedule" 
          label="Terlambat" 
          value={stats.telat} 
          trend="-4% dari rata-rata" 
          colorClass="bg-secondary-container text-on-secondary-container"
          barWidth="15%"
          barColor="bg-secondary"
        />
        <MetricCard 
          icon="event_note" 
          label="Izin / Sakit" 
          value={stats.izin} 
          trend="+2 hari ini" 
          colorClass="bg-error-container/20 text-error"
          barWidth="8%"
          barColor="bg-error"
        />
      </section>

      {/* Table Section */}
      <section className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0px_12px_32px_rgba(42,52,57,0.04)] dark:shadow-none border border-outline-variant/10">
        <div className="px-4 sm:px-8 py-6 flex justify-between items-center border-b border-surface-container-low">
          <h3 className="text-base sm:text-lg font-bold text-on-surface">Data Presensi</h3>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex bg-surface-container-low rounded-lg p-1">
              <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md bg-surface-container-lowest shadow-sm text-primary">Semua</button>
              <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md text-on-surface-variant opacity-60">Guru/Staff</button>
            </div>
            <ExportButton 
              date={today} 
              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-outline-variant/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span className="hidden sm:inline">Ekspor Excel</span>
              <span className="sm:hidden">Excel</span>
            </ExportButton>
          </div>
        </div>

        {/* Responsive Attendance View */}
        <div className="overflow-x-auto">
          {/* Mobile Grid View (Card based) */}
          <div className="md:hidden divide-y divide-surface-container-low">
            {todayAttendance.length === 0 ? (
              <div className="px-6 py-12 text-center text-outline/60 text-sm font-medium">Belum ada aktivitas hari ini</div>
            ) : (
              todayAttendance.map((att) => (
                <div key={att.id} className="p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-low overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-primary shadow-inner">
                        {att.profiles?.avatar_url ? (
                          <Image src={att.profiles.avatar_url} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          att.profiles?.full_name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{att.profiles?.full_name}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant opacity-50 uppercase tracking-wider truncate">ID: {att.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(att.status)} className="px-3 py-1 text-[9px] uppercase tracking-widest font-black rounded-full">
                      {statusLabel(att.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-surface-container-low/50 p-3 rounded-xl border border-outline-variant/5">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-outline uppercase tracking-widest">Masuk</span>
                      <span className="text-sm font-medium text-on-surface">{att.check_in ? format(parseISO(att.check_in), 'HH:mm') : '--:--'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-outline uppercase tracking-widest">Pulang</span>
                      <span className="text-sm font-medium text-on-surface">{att.check_out ? format(parseISO(att.check_out), 'HH:mm') : '--:--'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <table className="hidden md:table w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Nama Lengkap</th>
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70 text-center">Jam Masuk</th>
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70 text-center">Jam Pulang</th>
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70 text-center">Status</th>
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70 text-right">Detil</th>
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
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-surface-container-low overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-primary shadow-inner">
                          {att.profiles?.avatar_url ? (
                            <Image src={att.profiles.avatar_url} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            att.profiles?.full_name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{att.profiles?.full_name}</p>
                          <p className="text-[10px] font-bold text-on-surface-variant opacity-50 uppercase tracking-wider truncate">ID: {att.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-on-surface-variant font-medium">
                      {att.check_in ? format(parseISO(att.check_in), 'HH:mm') : '--:--'}
                    </td>
                    <td className="px-8 py-5 text-sm text-on-surface-variant font-medium">
                      {att.check_out ? format(parseISO(att.check_out), 'HH:mm') : '--:--'}
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

        {/* Pagination Footer */}
        <div className="px-4 sm:px-8 py-6 border-t border-surface-container-low bg-surface-container-lowest/50 flex items-center justify-between">
          <p className="text-[10px] sm:text-[11px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">
             {todayAttendance.length} data ditemukan
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-outline-variant/20 text-on-surface-variant disabled:opacity-30" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20">1</button>
            <button className="p-2 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Real-time Ribbon - Premium Desktop only */}
      <div className="hidden md:flex fixed bottom-10 right-12 left-auto bg-surface-container-lowest/60 backdrop-blur-xl px-7 py-5 rounded-full border border-outline-variant/10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] items-center gap-8 max-w-2xl z-40 animate-fade-in translate-y-0 group hover:-translate-y-1 transition-all duration-300">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Status Sistem</span>
          <span className="text-xs font-bold text-on-surface-variant">Aktivitas Langsung</span>
        </div>
        <div className="w-[180px] h-2 bg-surface-container-highest rounded-full relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-[65%] bg-primary animate-pulse"></div>
        </div>
        <div className="flex -space-x-3">
          {[1,2,3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-surface-container-low shadow-sm ring-1 ring-black/5 flex items-center justify-center overflow-hidden">
               <div className="w-full h-full bg-primary/10" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Aktif</span>
        </div>
      </div>
    </div>
  );
}
