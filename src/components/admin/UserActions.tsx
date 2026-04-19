'use client';

import { useState, useTransition } from 'react';
import { updateProfile, deleteProfile } from '@/lib/actions/admin';
import { Profile } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { MoreVertical, Pencil, UserX, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function UserActions({ user }: { user: Profile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    full_name: user.full_name,
    position:  user.position ?? '',
    role:      user.role,
  });

  const handleToggleActive = () => {
    startTransition(async () => {
      const res = await updateProfile(user.id, { is_active: !user.is_active });
      if (res.success) {
        toast.success(user.is_active ? 'Pengguna dinonaktifkan' : 'Pengguna diaktifkan');
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setOpen(false);
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfile(user.id, {
        full_name: form.full_name,
        position:  form.position || null,
        role:      form.role,
      });
      if (res.success) {
        toast.success('Profil diperbarui');
        setEditOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      <div className="relative">
        <div className="flex gap-1">
          <button
            onClick={() => setEditOpen(true)}
            className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={handleToggleActive}
            disabled={isPending}
            className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors"
            title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          >
            {user.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Pengguna">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            required
          />
          <Input
            label="Jabatan"
            value={form.position}
            onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
            placeholder="Contoh: Guru Matematika"
          />
          <Select
            label="Role"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
          >
            <option value="staff">Staf</option>
            <option value="admin">Admin</option>
          </Select>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={isPending} className="flex-1">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
