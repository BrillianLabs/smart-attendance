import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';
import { getAllProfiles } from '@/lib/actions/admin';
import { Badge } from '@/components/ui/Badge';
import { UserActions } from '@/components/admin/UserActions';
import { AddUserModal } from '@/components/admin/AddUserModal';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = { title: 'Direktori Pengguna | SD Negeri Nguwok' };

export default async function AdminUsersPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') redirect('/');

  const users = await getAllProfiles();

  return (
    <div className="space-y-10 animate-fade-in pb-24">
      {/* Dynamic Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">Management Portal</span>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Student & Staff Directory</h1>
          <p className="text-sm font-medium text-on-surface-variant opacity-60">
            Managing <span className="text-on-surface font-bold">{users.length}</span> verified academy members.
          </p>
        </div>
        <AddUserModal />
      </section>

      {/* Styled Table Container - Matching Dashboard Style */}
      <section className="bg-surface-container-lowest rounded-[2.5rem] overflow-hidden shadow-sm shadow-primary/5 border border-outline-variant/10">
        <div className="px-8 py-6 flex justify-between items-center border-b border-surface-container-low">
          <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
             <h3 className="text-lg font-bold text-on-surface">Academy Registry</h3>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/10">
                <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md bg-surface-container-lowest shadow-sm text-primary">Active</button>
                <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md text-on-surface-variant opacity-60">Archived</button>
             </div>
             <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Member Profile</th>
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Designation</th>
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Portal Access</th>
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Status</th>
                <th className="px-8 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant opacity-70 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <span className="material-symbols-outlined text-5xl text-outline/30 mb-4 block">group_off</span>
                    <p className="text-sm font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">No members registered in directory</p>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className={cn(
                    "hover:bg-surface-container-low/30 transition-all group",
                    !user.is_active && "bg-error-container/5"
                  )}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-surface-container-low border border-outline-variant/10 overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-primary shadow-sm">
                          {user.avatar_url ? (
                            <Image src={user.avatar_url} alt={user.full_name} width={44} height={44} className="object-cover" />
                          ) : (
                            user.full_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-[0.9375rem] font-bold text-on-surface group-hover:text-primary transition-colors">{user.full_name}</p>
                          <p className="text-[10px] font-bold text-on-surface-variant opacity-50 uppercase tracking-wider">Joined {new Date().getFullYear()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-medium text-on-surface-variant">
                        {user.position || 'Standard Member'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant={user.role === 'admin' ? 'info' : 'gray'} className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {user.role === 'admin' ? 'Administrator' : 'Staff/Guru'}
                      </Badge>
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant={user.is_active ? 'success' : 'danger'} className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {user.is_active ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <UserActions user={user} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-6 border-t border-surface-container-low bg-surface-container-lowest flex items-center justify-between">
           <p className="text-[10px] font-black text-on-surface-variant opacity-40 uppercase tracking-[0.2em]">Total Database Index: {users.length}</p>
           <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm ring-1 ring-outline-variant/10">Bulk Export</button>
              <button className="btn btn-secondary btn-sm ring-1 ring-outline-variant/10">Archival</button>
           </div>
        </div>
      </section>
    </div>
  );
}
