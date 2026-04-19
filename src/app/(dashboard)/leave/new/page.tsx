'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitLeave } from '@/lib/actions/leave';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewLeavePage() {
  const router   = useRouter();
  const [isPending, startTransition] = useTransition();
  const today    = format(new Date(), 'yyyy-MM-dd');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitLeave(formData);
      if (res.success) {
        toast.success('Izin berhasil diajukan!');
        router.push('/leave');
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/leave" className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
          <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Ajukan Izin</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Isi form pengajuan izin di bawah</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select name="leave_type" label="Jenis Izin" required>
            <option value="">Pilih jenis izin...</option>
            <option value="sakit">Sakit</option>
            <option value="izin">Izin</option>
            <option value="cuti">Cuti</option>
            <option value="dinas">Dinas Luar</option>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              name="start_date"
              label="Tanggal Mulai"
              required
              min={today}
              defaultValue={today}
            />
            <Input
              type="date"
              name="end_date"
              label="Tanggal Selesai"
              required
              min={today}
              defaultValue={today}
            />
          </div>

          <Textarea
            name="reason"
            label="Alasan"
            required
            placeholder="Tuliskan alasan pengajuan izin Anda..."
            rows={4}
          />

          <div className="flex gap-3 pt-2">
            <Link href="/leave" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">
                Batal
              </Button>
            </Link>
            <Button type="submit" loading={isPending} className="flex-1">
              Kirim Pengajuan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
