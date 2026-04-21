import type { Metadata } from 'next';
import { getTodayAttendance, getMyAttendanceHistory } from '@/lib/actions/attendance';
import { getSettings } from '@/lib/actions/admin';
import { getProfile } from '@/lib/actions/auth';
import { AttendanceClient } from '@/components/attendance/AttendanceClient';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = { title: 'Log Presensi | SD Negeri Nguwok' };

export default async function AttendancePage() {
  const [todayAtt, settings, history, profile] = await Promise.all([
    getTodayAttendance(),
    getSettings(),
    getMyAttendanceHistory(30),
    getProfile(),
  ]);

  if (!profile) return null;

  const todayStr = format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale });

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-24">
      {/* Page Header */}
      <section className="px-1">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">Personal Logs</span>
        <h1 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">Riwayat Presensi</h1>
        <p className="text-sm font-medium text-on-surface-variant opacity-60 mt-1">{todayStr}</p>
      </section>

      {/* Main Digital Presence Widget */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-8 lg:p-10 shadow-sm shadow-primary/5 border border-outline-variant/10">
        <h2 className="text-base sm:text-lg font-bold text-on-surface mb-6">Presensi Digital</h2>
        <AttendanceClient initial={todayAtt} settings={settings} profile={profile} />
      </div>

      {/* Detailed History Table */}
      <section className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm shadow-primary/5 border border-outline-variant/10">
        <div className="px-4 sm:px-8 py-6 border-b border-surface-container-low flex justify-between items-center">
          <h3 className="text-base sm:text-lg font-bold text-on-surface">Riwayat 30 Hari</h3>
          <div className="flex bg-surface-container-low rounded-lg p-1">
            <button className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md bg-surface-container-lowest shadow-sm text-primary">List View</button>
            <button className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md text-on-surface-variant opacity-60">Calendar</button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-4 sm:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Tanggal</th>
                <th className="px-4 sm:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Masuk</th>
                <th className="px-4 sm:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Pulang</th>
                <th className="px-4 sm:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-outline/40 text-sm font-medium uppercase tracking-[0.1em]">No records found for the past 30 days</td>
                </tr>
              ) : (
                history.map((att) => (
                  <tr key={att.id} className="hover:bg-surface-container-low/30 transition-colors group">
                    <td className="px-4 sm:px-8 py-4">
                      <p className="text-sm font-bold text-on-surface">
                        {format(parseISO(att.date), 'EEE, d MMM', { locale: idLocale })}
                      </p>
                      <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-wider">TA 2024/2025</p>
                    </td>
                    <td className="px-4 sm:px-8 py-4">
                      <span className="text-sm font-medium text-on-surface opacity-80">
                        {att.check_in ? format(parseISO(att.check_in), 'HH:mm') : '--:--'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-8 py-4">
                      <span className="text-sm font-medium text-on-surface opacity-80">
                        {att.check_out ? format(parseISO(att.check_out), 'HH:mm') : '--:--'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-8 py-4">
                      <Badge variant={statusVariant(att.status)} className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {statusLabel(att.status)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-6 bg-surface-container-lowest/50 border-t border-outline-variant/5 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-outline opacity-40">End of Personal Logs</p>
        </div>
      </section>
    </div>
  );
}
