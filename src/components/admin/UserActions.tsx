'use client';

import { useState, useTransition } from 'react';
import { updateProfile, deleteProfile } from '@/lib/actions/admin';
import { Profile } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { MoreVertical, Pencil, UserX, UserCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/context/ConfirmContext';
import { cn } from '@/lib/utils/cn';

export function UserActions({ user }: { user: Profile }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    full_name: user.full_name,
    position:  user.position ?? '',
    role:      user.role,
  });

  const handleToggleActive = async () => {
    if (user.is_active) {
      const ok = await confirm({
        title: 'Nonaktifkan Pengguna',
        message: `Apakah Anda yakin ingin menonaktifkan akses untuk ${user.full_name}? Pengguna ini tidak akan bisa melakukan absen.`,
        confirmLabel: 'Ya, Nonaktifkan',
        variant: 'warning'
      });
      if (!ok) return;
    }

    startTransition(async () => {
      const res = await updateProfile(user.id, { is_active: !user.is_active });
      if (res.success) {
        toast.success(user.is_active ? 'Pengguna dinonaktifkan' : 'Pengguna diaktifkan');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Hapus Pengguna',
      message: `Tindakan ini tidak dapat dibatalkan. Seluruh data presensi dan profil ${user.full_name} akan dihapus secara permanen. Lanjutkan?`,
      confirmLabel: 'Hapus Permanen',
      variant: 'danger'
    });

    if (ok) {
      startTransition(async () => {
        const res = await deleteProfile(user.id);
        if (res.success) {
          toast.success('Pengguna berhasil dihapus');
          router.refresh();
        } else {
          toast.error(res.error);
        }
      });
    }
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
        <div className="flex gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-all hover:text-primary active:scale-90"
            title="Edit Profil"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={handleToggleActive}
            disabled={isPending}
            className={cn(
              "p-2 rounded-xl transition-all active:scale-90",
              user.is_active ? "hover:bg-amber-500/10 text-amber-500" : "hover:bg-primary/10 text-primary"
            )}
            title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          >
            {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2 rounded-xl hover:bg-error/10 text-error transition-all active:scale-90"
            title="Hapus Permanen"
          >
            <Trash2 size={16} />
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
