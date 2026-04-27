import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getSettings } from '@/lib/actions/admin';
import { getTodayAttendance, getMyAttendanceHistory } from '@/lib/actions/attendance';
import { getMyLeaveRequests } from '@/lib/actions/leave';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { AttendanceClient } from '@/components/attendance/AttendanceClient';
import { formatWIB, getTimezoneAbbreviation, getAcademicYear } from '@/lib/utils/date';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Attendance, LeaveRequest } from '@/lib/types';

export const metadata: Metadata = { title: 'Dashboard | SIGAP' };

export default async function DashboardPage() {
  const [profile, settings, todayAtt, history, leaves] = await Promise.all([
    getProfile(),
    getSettings(),
    getTodayAttendance(),
    getMyAttendanceHistory(7),
    getMyLeaveRequests(),
  ]);

  if (!profile) redirect('/login');
  if (profile.role === 'admin') redirect('/admin');

  const todayStr = formatWIB(new Date(), 'EEEE, d MMMM yyyy');
  const pendingLeavesCount = leaves.filter((l: LeaveRequest) => l.status === 'pending').length;

  // Stats calculation
  const totalPresence = history.length;
  const presenceRate = totalPresence > 0 ? Math.round((history.filter((h: Attendance) => h.status === 'hadir').length / totalPresence) * 100) : 100;

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-24">
      {/* Header Section - Exactly like Template */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <p className="text-on-surface-variant text-sm font-medium tracking-wide mb-1 uppercase opacity-70">
            {todayStr}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-on-background leading-tight">
            Selamat Datang di <span className="text-primary italic">SIGAP</span>
          </h1>
          <p className="text-on-surface-variant text-sm font-medium opacity-60 mt-2">
            Sistem Informasi Guru Absensi Pintar - SD NEGERI NGUWOK
          </p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-low px-5 py-2.5 rounded-2xl border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-2 pr-4 border-r border-outline-variant/20">
            <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
            <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-40 leading-none mb-0.5">Tahun Ajaran</span>
               <span className="text-xs font-bold tracking-tight text-on-surface">{getAcademicYear()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-40 leading-none mb-0.5">Tahun Anggaran</span>
               <span className="text-xs font-bold tracking-tight text-on-surface">{new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Absence Widget (GPS & Map) - Matching Template */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm shadow-primary/5 flex flex-col border border-outline-variant/10">
          <div className="p-5 sm:p-8 lg:p-10 pb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1">Presensi Digital</h2>
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Radius Aman (GPS Verified)</span>
                </div>
              </div>
              <button className="bg-surface-container-low p-4 rounded-2xl hover:bg-surface-container-high transition-colors active:scale-95 group border border-outline-variant/5">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">photo_camera</span>
                <span className="block text-[10px] font-bold mt-1 uppercase text-primary">Verifikasi</span>
              </button>
            </div>
            
            <AttendanceClient initial={todayAtt} settings={settings} profile={profile} />
          </div>
        </div>

        {/* Side Widgets / Summary */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          {/* Status Card - Matching Template */}
          <div className="bg-primary-container p-8 rounded-[2rem] relative overflow-hidden group shadow-lg shadow-primary/10 border border-primary/10">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 text-on-primary-container">
              <p className="font-bold text-[10px] uppercase tracking-widest mb-2 opacity-70">Status Hari Ini</p>
              <h3 className="text-3xl font-black mb-6 italic tracking-tight">
                {todayAtt ? statusLabel(todayAtt.status) : 'Belum Presensi'}
              </h3>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full w-fit backdrop-blur-md">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <p className="text-sm font-medium tracking-tight italic">
                  Shift: {settings?.work_start_time?.substring(0, 5) ?? '07:30'} - {settings?.work_end_time?.substring(0, 5) ?? '15:00'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats - Matching Template */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-surface-container-low p-5 sm:p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm">
              <span className="material-symbols-outlined text-primary mb-2 sm:mb-3 text-xl sm:text-2xl">trending_up</span>
              <p className="text-2xl sm:text-3xl font-black tracking-tighter text-on-background">{presenceRate}%</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-70">Kehadiran</p>
            </div>
            <div className="bg-surface-container-low p-5 sm:p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm">
              <span className="material-symbols-outlined text-secondary mb-2 sm:mb-3 text-xl sm:text-2xl">pending_actions</span>
              <p className="text-2xl sm:text-3xl font-black tracking-tighter text-on-background">{pendingLeavesCount}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-70">Izin Pending</p>
            </div>
          </div>

          {/* User Links Quick Action */}
          <div className="mt-auto bg-surface p-6 rounded-[2rem] border-2 border-dashed border-outline-variant/30 flex flex-col gap-3">
             <Link href="/leave/new" className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:translate-x-1 transition-all group border border-outline-variant/5">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">add_circle</span>
                  <span className="text-sm font-bold text-on-surface-variant">Ajukan Izin Baru</span>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary">chevron_right</span>
              </Link>
          </div>
        </div>
      </div>

      {/* History Section - Matching Template List Items */}
      <section className="mt-16">
        <div className="flex justify-between items-center mb-8 px-2">
          <h2 className="text-2xl font-bold tracking-tight">Riwayat Kehadiran Minggu Ini</h2>
          <Link href="/attendance" className="text-primary font-bold text-sm tracking-tight hover:underline">Lihat Semua</Link>
        </div>
        
        <div className="bg-surface-container-lowest rounded-[2rem] p-4 overflow-hidden shadow-sm shadow-primary/5 border border-outline-variant/10">
          <div className="flex flex-col divide-y divide-surface-container">
            {history.length === 0 ? (
              <div className="py-12 text-center text-outline/50">
                <span className="material-symbols-outlined text-4xl mb-3">history</span>
                <p className="text-sm font-medium">Belum ada aktivitas minggu ini.</p>
              </div>
            ) : (
              history.map((att: Attendance) => (
                <div key={att.id} className="flex items-center justify-between p-5 hover:bg-surface-container-low transition-colors rounded-2xl group border-none">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                      att.status === 'hadir' ? "bg-primary-container text-on-primary-container" : "bg-secondary-container text-on-secondary-container"
                    )}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {att.status === 'hadir' ? 'check_circle' : 'error'}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold tracking-tight text-on-surface">
                        {formatWIB(att.date, 'EEEE, d MMMM yyyy')}
                      </p>
                      <p className="text-xs text-on-surface-variant font-medium opacity-60">
                        {att.check_in ? `${formatWIB(att.check_in, 'HH:mm')} ${getTimezoneAbbreviation()}` : '--:--'} • {att.check_in_lat ? 'GPS Office' : 'Remote'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant={statusVariant(att.status)} className="px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all group-hover:shadow-md">
                        {statusLabel(att.status)}
                      </Badge>
                      {att.check_out && (
                        <div className="flex items-center gap-2">
                          {(() => {
                            let coStatus = att.checkout_status;
                            if (!coStatus) {
                              const coTime = new Date(att.check_out);
                              const wibString = coTime.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour12: false });
                              const [h, m] = wibString.split(':').map(Number);
                              const isEarly = h < 12 || (h === 12 && m < 10);
                              coStatus = isEarly ? 'pulang_awal' : 'pulang_sesuai';
                            }
                            return (
                              <Badge variant={statusVariant(coStatus)} className="px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all group-hover:shadow-md">
                                {statusLabel(coStatus)}
                              </Badge>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
