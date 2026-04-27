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

export const metadata: Metadata = { title: 'Laporan Presensi | SD Negeri Nguwok' };

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
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">SD NEGERI NGUWOK Analytics</span>
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
              className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-48">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1">Monthly View</label>
            <input
              type="month"
              name="month"
              defaultValue={month}
              className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-64">
             <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1">Member Focus</label>
             <select name="userId" defaultValue={userId ?? ''} className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 transition-all appearance-none">
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

      {/* Results Table - Matching Template Style */}
      <section className="bg-surface-container-lowest rounded-[2.5rem] overflow-hidden shadow-sm shadow-primary/5 border border-outline-variant/10">
        <div className="px-8 py-6 border-b border-surface-container-low flex justify-between items-center">
           <h3 className="text-lg font-bold text-on-surface">Data Indices</h3>
           <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Nama Anggota</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Date Index</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Masuk</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Pulang</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline/20 mb-3 block">search_off</span>
                    <p className="text-xs font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">No matching records found</p>
                  </td>
                </tr>
              ) : (
                attendance.map(att => (
                  <tr key={att.id} className="hover:bg-surface-container-low/30 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-container-low overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-primary border border-outline-variant/5">
                          {att.profiles?.avatar_url ? (
                            <Image src={att.profiles.avatar_url} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            att.profiles?.full_name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{att.profiles?.full_name ?? 'Unknown'}</p>
                          <p className="text-[10px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">{att.profiles?.position ?? 'Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-on-surface">
                        {formatWIB(att.date, 'EEEE, d MMM')}
                      </p>
                      <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">TA {getAcademicYear(att.date)}</p>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-on-surface">{formatWIB(att.check_in, 'HH:mm')}</span>
                          <span className="text-[9px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">Masuk</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-on-surface">{att.check_out ? formatWIB(att.check_out, 'HH:mm') : '--:--'}</span>
                          <span className="text-[9px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">Pulang</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant={statusVariant(att.status)} className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {statusLabel(att.status)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
