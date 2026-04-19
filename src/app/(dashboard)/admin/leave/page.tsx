import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getAllLeaveRequests } from '@/lib/actions/leave';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { LeaveReviewButtons } from '@/components/admin/LeaveReviewButtons';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export const metadata: Metadata = { title: 'Persetujuan Izin' };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminLeavePage({ searchParams }: Props) {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') redirect('/');

  const params = await searchParams;
  const status = (params.status as any) ?? undefined;
  const leaves = await getAllLeaveRequests(status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Persetujuan Izin</h1>
        <p className="text-[var(--text-muted)] mt-1">{leaves.length} pengajuan</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <a
            key={s}
            href={s ? `/admin/leave?status=${s}` : '/admin/leave'}
            className={`btn btn-sm ${(status ?? '') === s ? 'btn-primary' : 'btn-secondary'}`}
          >
            {s === '' ? 'Semua' : statusLabel(s)}
          </a>
        ))}
      </div>

      <Card padding="none">
        {leaves.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-muted)] py-12">
            Tidak ada pengajuan izin.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {leaves.map(leave => (
              <div key={leave.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-sm font-bold flex-shrink-0"
                         style={{ color: 'var(--primary)' }}>
                      {(leave.profiles?.full_name ?? 'U').charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {leave.profiles?.full_name ?? '-'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {leave.profiles?.position ?? 'Staf'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="gray" className="text-xs capitalize">{leave.leave_type}</Badge>
                        <span className="text-xs text-[var(--text-muted)]">
                          {format(parseISO(leave.start_date), 'd MMM', { locale: idLocale })}
                          {leave.start_date !== leave.end_date && (
                            <> – {format(parseISO(leave.end_date), 'd MMM yyyy', { locale: idLocale })}</>
                          )}
                          {leave.start_date === leave.end_date && (
                            <>, {format(parseISO(leave.start_date), 'yyyy')}</>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mt-2">{leave.reason}</p>
                      {leave.admin_note && (
                        <p className="text-xs italic text-[var(--text-muted)] mt-1">
                          Catatan: {leave.admin_note}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 sm:flex-shrink-0">
                    <Badge variant={statusVariant(leave.status)}>{statusLabel(leave.status)}</Badge>
                    {leave.status === 'pending' && (
                      <LeaveReviewButtons leaveId={leave.id} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
