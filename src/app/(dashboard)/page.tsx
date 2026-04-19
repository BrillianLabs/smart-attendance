import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getSettings } from '@/lib/actions/admin';
import { getTodayAttendance, getMyAttendanceHistory } from '@/lib/actions/attendance';
import { getMyLeaveRequests } from '@/lib/actions/leave';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import {
  CheckCircle2, Clock, XCircle, CalendarDays, TrendingUp,
  MapPin, FileText, ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Link from 'next/link';
import { Attendance } from '@/lib/types';

export const metadata: Metadata = { title: 'Dashboard' };

function StatCard({
  icon: Icon, label, value, color, bg
}: { icon: React.ElementType; label: string; value: string | number; color: string; bg: string }) {
  return (
    <div className="card p-5 flex items-center gap-4 card-hover animate-fade-in">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
      </div>
    </div>
  );
}

function AttendanceRow({ att }: { att: Attendance }) {
  const checkIn  = att.check_in  ? format(parseISO(att.check_in),  'HH:mm') : '-';
  const checkOut = att.check_out ? format(parseISO(att.check_out), 'HH:mm') : '-';
  const date     = format(parseISO(att.date), 'EEE, d MMM', { locale: idLocale });

  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{date}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{checkIn} → {checkOut}</p>
      </div>
      <Badge variant={statusVariant(att.status)}>{statusLabel(att.status)}</Badge>
    </div>
  );
}

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

  const todayStr = format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale });
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

  // Monthly stats from history
  const thisMonth = history.filter(a => a.date.startsWith(format(new Date(), 'yyyy-MM')));
  const hadirCount = thisMonth.filter(a => a.status === 'hadir').length;
  const telatCount = thisMonth.filter(a => a.status === 'telat').length;
  const izinCount  = thisMonth.filter(a => a.status === 'izin').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Halo, {profile.full_name.split(' ')[0]} 👋
        </h1>
        <p className="text-[var(--text-muted)] mt-1 capitalize">{todayStr}</p>
      </div>

      {/* Today's status */}
      <Card className="border-l-4" style={{ borderLeftColor: 'var(--primary)' }}>
        <CardHeader>
          <CardTitle>Status Hari Ini</CardTitle>
          {todayAtt && (
            <Badge variant={statusVariant(todayAtt.status)}>
              {statusLabel(todayAtt.status)}
            </Badge>
          )}
        </CardHeader>

        {todayAtt ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--success-light)]">
              <CheckCircle2 size={20} className="text-[var(--success)]" />
              <div>
                <p className="text-xs text-[var(--text-muted)]">Masuk</p>
                <p className="font-semibold text-[var(--text-primary)]">
                  {todayAtt.check_in ? format(parseISO(todayAtt.check_in), 'HH:mm') : '-'}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              todayAtt.check_out ? 'bg-[var(--info-light)]' : 'bg-[var(--surface-2)]'
            }`}>
              <Clock size={20} className={todayAtt.check_out ? 'text-[var(--info)]' : 'text-[var(--text-muted)]'} />
              <div>
                <p className="text-xs text-[var(--text-muted)]">Pulang</p>
                <p className="font-semibold text-[var(--text-primary)]">
                  {todayAtt.check_out ? format(parseISO(todayAtt.check_out), 'HH:mm') : 'Belum'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <MapPin size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)] mb-4">Belum absen hari ini</p>
            <Link
              href="/attendance"
              className="btn btn-primary btn-sm inline-flex"
              style={{ background: settings?.primary_color ?? 'var(--primary)' }}
            >
              Absen Sekarang
            </Link>
          </div>
        )}
      </Card>

      {/* Monthly stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={CheckCircle2}
          label="Hadir"
          value={hadirCount}
          color="text-[var(--success)]"
          bg="bg-[var(--success-light)]"
        />
        <StatCard
          icon={Clock}
          label="Terlambat"
          value={telatCount}
          color="text-[var(--warning)]"
          bg="bg-[var(--warning-light)]"
        />
        <StatCard
          icon={XCircle}
          label="Izin"
          value={izinCount}
          color="text-[var(--info)]"
          bg="bg-[var(--info-light)]"
        />
      </div>

      {/* Pending leave notification */}
      {pendingLeaves > 0 && (
        <Link href="/leave" className="block">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--warning-light)] border border-[var(--warning)] border-opacity-30">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-[var(--warning)]" />
              <p className="text-sm font-medium text-[#92400e]">
                {pendingLeaves} pengajuan izin sedang menunggu
              </p>
            </div>
            <ChevronRight size={18} className="text-[#92400e]" />
          </div>
        </Link>
      )}

      {/* Recent attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Absensi</CardTitle>
          <Link href="/attendance" className="text-xs font-medium" style={{ color: settings?.primary_color ?? 'var(--primary)' }}>
            Lihat semua
          </Link>
        </CardHeader>
        {history.length === 0 ? (
          <p className="text-sm text-center text-[var(--text-muted)] py-6">Belum ada data absensi.</p>
        ) : (
          <div>
            {history.slice(0, 5).map(att => (
              <AttendanceRow key={att.id} att={att} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
