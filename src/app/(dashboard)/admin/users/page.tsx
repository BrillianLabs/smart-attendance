import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getAllProfiles } from '@/lib/actions/admin';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { UserActions } from '@/components/admin/UserActions';
import { AddUserModal } from '@/components/admin/AddUserModal';
import { Users } from 'lucide-react';

export const metadata: Metadata = { title: 'Kelola Pengguna' };

export default async function AdminUsersPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') redirect('/');

  const users = await getAllProfiles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Kelola Pengguna</h1>
          <p className="text-[var(--text-muted)] mt-1">{users.length} pengguna terdaftar</p>
        </div>
        <AddUserModal />
      </div>

      <Card padding="none">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">Belum ada pengguna.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Jabatan</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-xs font-bold flex-shrink-0"
                             style={{ color: 'var(--primary)' }}>
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="text-[var(--text-muted)]">{user.position ?? '-'}</td>
                    <td>
                      <Badge variant={user.role === 'admin' ? 'info' : 'gray'}>
                        {user.role === 'admin' ? 'Admin' : 'Staf'}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={user.is_active ? 'success' : 'danger'}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td>
                      <UserActions user={user} />
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
