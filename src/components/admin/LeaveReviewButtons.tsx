'use client';

import { useState, useTransition } from 'react';
import { reviewLeave } from '@/lib/actions/leave';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function LeaveReviewButtons({ leaveId }: { leaveId: string }) {
  const router    = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote]   = useState('');

  const handleReview = (status: 'approved' | 'rejected') => {
    startTransition(async () => {
      const res = await reviewLeave(leaveId, status, note || undefined);
      if (res.success) {
        toast.success(status === 'approved' ? 'Izin disetujui' : 'Izin ditolak');
        setModal(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="success"
          onClick={() => setModal('approve')}
          disabled={isPending}
        >
          <CheckCircle2 size={14} />
          Setujui
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => setModal('reject')}
          disabled={isPending}
        >
          <XCircle size={14} />
          Tolak
        </Button>
      </div>

      {/* Approve modal */}
      <Modal
        open={modal === 'approve'}
        onClose={() => setModal(null)}
        title="Setujui Izin"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant opacity-70">
            Konfirmasi persetujuan izin ini?
          </p>
          <Textarea
            label="Catatan (opsional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Tambahkan catatan jika diperlukan..."
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>
              Batal
            </Button>
            <Button
              variant="success"
              className="flex-1"
              loading={isPending}
              onClick={() => handleReview('approved')}
            >
              Ya, Setujui
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal
        open={modal === 'reject'}
        onClose={() => setModal(null)}
        title="Tolak Izin"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant opacity-70">
            Masukkan alasan penolakan izin ini.
          </p>
          <Textarea
            label="Alasan Penolakan"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Tuliskan alasan penolakan..."
            rows={3}
            required
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={isPending}
              onClick={() => handleReview('rejected')}
            >
              Tolak Izin
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
