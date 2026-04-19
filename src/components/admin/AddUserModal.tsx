'use client';

import { useState, useTransition } from 'react';
import { createStaffUser } from '@/lib/actions/admin';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function AddUserModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email:     '',
    password:  '',
    full_name: '',
    role:      'staff' as 'admin' | 'staff',
    position:  '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createStaffUser(
        form.email,
        form.password,
        form.full_name,
        form.role,
        form.position || undefined
      );
      if (res.success) {
        toast.success('Pengguna berhasil ditambahkan!');
        setOpen(false);
        setForm({ email: '', password: '', full_name: '', role: 'staff', position: '' });
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus size={16} />
        Tambah Pengguna
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Pengguna Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            required
            placeholder="Nama lengkap pengguna"
          />
          <Input
            type="email"
            label="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            placeholder="email@sekolah.sch.id"
          />
          <Input
            type="password"
            label="Password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            placeholder="Minimal 8 karakter"
            minLength={8}
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
            <option value="staff">Staf / Guru</option>
            <option value="admin">Admin</option>
          </Select>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={isPending} className="flex-1">
              Tambahkan
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
