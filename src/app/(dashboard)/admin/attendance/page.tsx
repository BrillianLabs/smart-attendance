import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getAdminAttendance } from '@/lib/actions/attendance';
import { getAllProfiles } from '@/lib/actions/admin';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { ExportButton } from '@/components/admin/ExportButton';
import { formatWIB, getAcademicYear } from '@/lib/utils/date';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { AttendanceTableClient } from '@/components/admin/AttendanceTableClient';

export const metadata: Metadata = { title: 'Laporan Presensi | SDN Kacangan' };

interface Props {
  searchParams: Promise<{ date?: string; month?: string; userId?: string; }>;
}

export default async function AdminAttendancePage({ searchParams }: Props) {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') redirect('/');

  const params  = await searchParams;
  const month   = params.month ?? formatWIB(new Date(), 'yyyy-MM');
  const userId  = params.userId;
  const viewDate = params.date;

  const [attendance, users] = await Promise.all([
    getAdminAttendance({ date: viewDate, month: viewDate ? undefined : month, userId }),
    getAllProfiles(),
  ]);

  return (
    <div className="space-y-10 animate-fade-in pb-24">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">SDN KACANGAN Analytics</span>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Attendance <span className="text-primary italic">Reports</span></h1>
          <p className="text-sm font-medium text-on-surface-variant opacity-60 mt-1">Found {attendance.length} verification records.</p>
        </div>
        <ExportButton month={month} userId={userId} />
      </section>

      {/* Filter Section - Tonal Design */}
      <section className="bg-surface-container-low p-6 lg:p-8 rounded-[2.5rem] border border-outline-variant/10">
        <form className="flex flex-wrap gap-6 items-end" method="GET">
          <div className="flex flex-col gap-2 w-full sm:w-48">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1">Specific Date</label>
            <input
              type="date"
              name="date"
              defaultValue={viewDate ?? ''}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/10 rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-48">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1">Monthly View</label>
            <input
              type="month"
              name="month"
              defaultValue={month}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/10 rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-64">
             <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1">Member Focus</label>
             <select name="userId" defaultValue={userId ?? ''} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/10 rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all appearance-none">
                <option value="">Semua Anggota</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
             </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Apply</button>
            <a href="/admin/attendance" className="px-6 py-3 bg-surface-container-high text-on-surface-variant rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Reset</a>
          </div>
        </form>
      </section>

      <AttendanceTableClient initialData={attendance} />
    </div>
  );
}
