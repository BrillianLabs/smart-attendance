import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getAdminStats } from '@/lib/actions/admin';
import { getAdminAttendance, getMonthlyStats } from '@/lib/actions/attendance';
import { getAllLeaveRequests } from '@/lib/actions/leave';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { AttendanceChart } from '@/components/admin/AttendanceChart';
import { Users, CheckCircle2, Clock, XCircle, AlertOctagon, FileText, ShieldCheck, Settings2, CalendarCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Dashboard Admin' };

function StatCard({ icon: Icon, label, value, color, bg, delay }: {
  icon: React.ElementType; label: string; value: number; color: string; bg: string; delay: string;
}) {
  return (
    <div className={`card p-6 flex flex-col justify-between relative overflow-hidden group animate-fade-in ${delay}`}>
      {/* Decorative background glow */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${bg}`}></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={24} className={color} />
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">{value}</p>
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">{label}</p>
        <div className="flex items-center gap-1.5 h-1">
          <div className={`h-full rounded-full transition-all duration-700 w-full ${bg.replace('bg-', 'bg-')}`}></div>
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') redirect('/');

  const today       = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = format(new Date(), 'yyyy-MM');

  const [stats, todayAttendance, chartData, pendingLeaves] = await Promise.all([
    getAdminStats(today),
    getAdminAttendance({ date: today, limit: 10 }),
    getMonthlyStats(currentMonth),
    getAllLeaveRequests('pending'),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Dashboard Admin
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex h-2 w-2 rounded-full bg-[var(--primary)]"></span>
            <p className="text-[var(--text-secondary)] font-medium capitalize">
              {format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Status Sistem</p>
            <p className="text-sm font-semibold text-[var(--success)] flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span>
              </span>
              Aktif
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard icon={Users} label="Total Staf" value={stats.total_staff} color="text-indigo-600" bg="bg-indigo-50" delay="[animation-delay:100ms]" />
        <StatCard icon={CheckCircle2} label="Hadir" value={stats.hadir} color="text-emerald-600" bg="bg-emerald-50" delay="[animation-delay:200ms]" />
        <StatCard icon={Clock} label="Terlambat" value={stats.telat} color="text-amber-600" bg="bg-amber-50" delay="[animation-delay:300ms]" />
        <StatCard icon={FileText} label="Izin" value={stats.izin} color="text-sky-600" bg="bg-sky-50" delay="[animation-delay:400ms]" />
        <StatCard icon={AlertOctagon} label="Tanpa Keterangan" value={stats.alpha} color="text-rose-600" bg="bg-rose-50" delay="[animation-delay:500ms]" />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-tr from-white to-slate-50">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Rekap Kehadiran</h3>
                <p className="text-sm text-[var(--text-muted)]">{format(new Date(), 'MMMM yyyy', { locale: idLocale })}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]"></div>
                <span className="text-xs font-bold text-slate-600">Presensi Bulanan</span>
              </div>
            </div>
            <div className="p-6">
              <AttendanceChart data={chartData} />
            </div>
          </Card>
          
          <Card className="hoverable shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Clock size={20} />
                </div>
                <CardTitle>Absensi Hari Ini</CardTitle>
              </div>
              <Link href="/admin/attendance" className="btn btn-sm btn-ghost text-[var(--primary)] hover:bg-[var(--primary-light)]">
                Lihat Semua
              </Link>
            </CardHeader>
            <div className="px-6 pb-6">
              {todayAttendance.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                    <Users size={32} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">Belum ada aktivitas absensi hari ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Staf</th>
                        <th className="text-left py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu</th>
                        <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {todayAttendance.map((att) => (
                        <tr key={att.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                {(att.profiles?.full_name ?? 'U').charAt(0)}
                              </div>
                              <span className="text-sm font-semibold text-slate-700">{att.profiles?.full_name ?? 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-600">
                                {att.check_in ? format(parseISO(att.check_in), 'HH:mm') : '--:--'}
                              </span>
                              <span className="text-xs text-slate-400">Check-in</span>
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <Badge variant={statusVariant(att.status)}>{statusLabel(att.status)}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <Card className="shadow-xl border-none bg-[var(--primary)] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck size={120} />
            </div>
            <CardHeader className="relative z-10 border-none mb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText size={18} />
                Izin Menunggu
              </CardTitle>
              {pendingLeaves.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white text-[var(--primary)] text-[10px] font-black uppercase">
                  {pendingLeaves.length} Baru
                </span>
              )}
            </CardHeader>
            <div className="px-6 pb-6 relative z-10">
              {pendingLeaves.length === 0 ? (
                <div className="py-8 text-center bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium opacity-80">Semua permintaan telah diproses.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingLeaves.slice(0, 4).map((leave) => (
                    <div key={leave.id} className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold truncate pr-2">{leave.profiles?.full_name ?? leave.user_id}</span>
                        <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-md">{leave.leave_type}</span>
                      </div>
                      <p className="text-xs opacity-70 flex items-center gap-1.5 font-medium">
                        <CalendarCheck size={12} />
                        {format(parseISO(leave.start_date), 'd MMM', { locale: idLocale })}
                        {leave.start_date !== leave.end_date && ` – ${format(parseISO(leave.end_date), 'd MMM', { locale: idLocale })}`}
                      </p>
                    </div>
                  ))}
                  <Link href="/admin/leave" className="flex items-center justify-center w-full py-3 rounded-xl bg-white text-[var(--primary)] text-sm font-bold hover:bg-indigo-50 transition-colors">
                    Kelola Semua Izin
                  </Link>
                </div>
              )}
            </div>
          </Card>
          
          <Card className="p-6 bg-slate-50 border-dashed border-2 border-slate-200">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Links</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'User Baru', icon: Users, href: '/admin/users' },
                { label: 'Setting', icon: Settings2, href: '/admin/settings' },
              ].map((item) => (
                <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[var(--primary)] transition-all group">
                  <item.icon size={20} className="text-slate-400 group-hover:text-[var(--primary)] transition-colors mb-2" />
                  <span className="text-xs font-bold text-slate-600">{item.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
