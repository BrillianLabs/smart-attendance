import type { Metadata } from 'next';
import { getTodayAttendance, getMyAttendanceHistory } from '@/lib/actions/attendance';
import { getSettings } from '@/lib/actions/admin';
import { AttendanceClient } from '@/components/attendance/AttendanceClient';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export const metadata: Metadata = { title: 'Absensi' };

export default async function AttendancePage() {
  const [todayAtt, settings, history] = await Promise.all([
    getTodayAttendance(),
    getSettings(),
    getMyAttendanceHistory(20),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Absensi</h1>
        <p className="text-[var(--text-muted)] mt-1 capitalize">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale })}
        </p>
      </div>

      {/* GPS Attendance Widget */}
      <AttendanceClient initial={todayAtt} settings={settings} />

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Absensi (20 hari terakhir)</CardTitle>
        </CardHeader>
        {history.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-muted)] py-8">Belum ada riwayat absensi.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Masuk</th>
                  <th>Pulang</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((att) => (
                  <tr key={att.id}>
                    <td className="font-medium">
                      {format(parseISO(att.date), 'EEE, d MMM', { locale: idLocale })}
                    </td>
                    <td>{att.check_in ? format(parseISO(att.check_in), 'HH:mm') : '-'}</td>
                    <td>{att.check_out ? format(parseISO(att.check_out), 'HH:mm') : '-'}</td>
                    <td>
                      <Badge variant={statusVariant(att.status)}>
                        {statusLabel(att.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
