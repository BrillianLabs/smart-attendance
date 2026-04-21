import { cn } from '@/lib/utils/cn';
import { HTMLAttributes } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'gray', className, children, ...props }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)} {...props}>
      <span className="w-1 h-1 rounded-full bg-current opacity-40 mr-1.5" />
      {children}
    </span>
  );
}

// Utility: map attendance/leave status to badge variant
export function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'hadir':    return 'success';
    case 'telat':    return 'warning';
    case 'izin':     return 'info';
    case 'alpha':    return 'danger';
    case 'approved': return 'success';
    case 'rejected': return 'danger';
    case 'pending':  return 'warning';
    default:         return 'gray';
  }
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    hadir:    'Hadir',
    telat:    'Terlambat',
    izin:     'Izin',
    alpha:    'Alpha',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    pending:  'Menunggu',
    sakit:    'Sakit',
    cuti:     'Cuti',
    dinas:    'Dinas',
  };
  return labels[status] ?? status;
}
