import { Attendance } from '../types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export function generateCSV(rows: Attendance[]): string {
  const headers = [
    'No', 'Nama', 'Jabatan', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Keterangan'
  ];

  const escape = (val: string | null | undefined) => {
    if (!val) return '';
    const str = String(val);
    // Escape quotes and wrap in quotes if contains comma/newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return '-';
    return format(new Date(ts), 'HH:mm', { locale: idLocale });
  };

  const formatDate = (d: string) => {
    return format(new Date(d), 'dd/MM/yyyy', { locale: idLocale });
  };

  const statusLabel: Record<string, string> = {
    hadir: 'Hadir', telat: 'Terlambat', izin: 'Izin', alpha: 'Alpha',
  };

  const lines = [headers.join(',')];
  rows.forEach((row, i) => {
    const cols = [
      i + 1,
      escape(row.profiles?.full_name ?? row.user_id),
      escape(row.profiles?.position),
      escape(formatDate(row.date)),
      escape(formatTime(row.check_in)),
      escape(formatTime(row.check_out)),
      escape(statusLabel[row.status] ?? row.status),
      escape(row.note),
    ];
    lines.push(cols.join(','));
  });

  return lines.join('\r\n');
}
