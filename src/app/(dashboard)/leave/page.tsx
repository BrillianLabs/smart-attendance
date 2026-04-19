import type { Metadata } from 'next';
import Link from 'next/link';
import { getMyLeaveRequests } from '@/lib/actions/leave';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, FileText, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export const metadata: Metadata = { title: 'Izin' };

const leaveTypeLabel: Record<string, string> = {
  sakit: 'Sakit', izin: 'Izin', cuti: 'Cuti', dinas: 'Dinas Luar',
};

export default async function LeavePage() {
  const leaves = await getMyLeaveRequests();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Izin</h1>
          <p className="text-[var(--text-muted)] mt-1">Pengajuan dan riwayat izin Anda</p>
        </div>
        <Link href="/leave/new">
          <Button size="sm">
            <Plus size={16} />
            Ajukan Izin
          </Button>
        </Link>
      </div>

      <Card padding="none">
        {leaves.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)] mb-4">Belum ada pengajuan izin.</p>
            <Link href="/leave/new">
              <Button size="sm">Ajukan Izin Pertama</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {leaves.map((leave) => (
              <div key={leave.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--info-light)] flex items-center justify-center flex-shrink-0">
                      <Calendar size={18} className="text-[var(--info)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {leaveTypeLabel[leave.leave_type] ?? leave.leave_type}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] mt-0.5">
                        {format(parseISO(leave.start_date), 'd MMM', { locale: idLocale })}
                        {leave.start_date !== leave.end_date && (
                          <> – {format(parseISO(leave.end_date), 'd MMM yyyy', { locale: idLocale })}</>
                        )}
                        {leave.start_date === leave.end_date && (
                          <>, {format(parseISO(leave.start_date), 'yyyy', { locale: idLocale })}</>
                        )}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {leave.reason}
                      </p>
                      {leave.admin_note && (
                        <p className="text-xs italic text-[var(--text-muted)] mt-1 bg-[var(--surface-2)] px-2 py-1 rounded">
                          Catatan admin: {leave.admin_note}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={statusVariant(leave.status)}>
                    {statusLabel(leave.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
