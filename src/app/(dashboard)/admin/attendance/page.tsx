import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getAdminAttendance } from '@/lib/actions/attendance';
import { getAllProfiles } from '@/lib/actions/admin';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { ExportButton } from '@/components/admin/ExportButton';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export const metadata: Metadata = { title: 'Rekap Kehadiran' };

interface Props {
  searchParams: Promise<{ date?: string; month?: string; userId?: string; }>;
}

export default async function AdminAttendancePage({ searchParams }: Props) {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') redirect('/');

  const params  = await searchParams;
  const today   = format(new Date(), 'yyyy-MM-dd');
  const month   = params.month ?? format(new Date(), 'yyyy-MM');
  const userId  = params.userId;
  const viewDate = params.date;

  const [attendance, users] = await Promise.all([
    getAdminAttendance({ date: viewDate, month: viewDate ? undefined : month, userId }),
    getAllProfiles(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Rekap Kehadiran</h1>
          <p className="text-[var(--text-muted)] mt-1">{attendance.length} record ditemukan</p>
        </div>
        <ExportButton month={month} userId={userId} />
      </div>

      {/* Filters */}
      <Card padding="sm">
        <form className="flex flex-wrap gap-3" method="GET">
          <div className="flex flex-col gap-1 w-full sm:w-40">
            <label className="text-xs text-[var(--text-muted)]">Per tanggal</label>
            <input
              type="date"
              name="date"
              defaultValue={viewDate ?? ''}
              className="input-field text-sm py-2"
            />
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-40">
            <label className="text-xs text-[var(--text-muted)]">Per bulan</label>
            <input
              type="month"
              name="month"
              defaultValue={month}
              className="input-field text-sm py-2"
            />
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-48">
            <label className="text-xs text-[var(--text-muted)]">Pengguna</label>
            <select name="userId" defaultValue={userId ?? ''} className="input-field text-sm py-2">
              <option value="">Semua pengguna</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end flex-shrink-0">
            <button type="submit" className="btn btn-primary btn-sm">Filter</button>
          </div>
          <div className="flex items-end flex-shrink-0">
            <a href="/admin/attendance" className="btn btn-secondary btn-sm">Reset</a>
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card padding="none">
        <CardHeader className="px-6 pt-5">
          <CardTitle>Data Kehadiran</CardTitle>
        </CardHeader>
        <div className="table-container">
          {attendance.length === 0 ? (
            <p className="text-center text-sm text-[var(--text-muted)] py-10">Data tidak ditemukan.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Jabatan</th>
                  <th>Tanggal</th>
                  <th>Masuk</th>
                  <th>Pulang</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(att => (
                  <tr key={att.id}>
                    <td className="font-medium">{att.profiles?.full_name ?? '-'}</td>
                    <td className="text-[var(--text-muted)]">{att.profiles?.position ?? '-'}</td>
                    <td>{format(parseISO(att.date), 'd MMM yyyy', { locale: idLocale })}</td>
                    <td>{att.check_in  ? format(parseISO(att.check_in),  'HH:mm') : '-'}</td>
                    <td>{att.check_out ? format(parseISO(att.check_out), 'HH:mm') : '-'}</td>
                    <td><Badge variant={statusVariant(att.status)}>{statusLabel(att.status)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
