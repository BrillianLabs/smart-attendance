'use client';

import { useState } from 'react';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { formatWIB, getAcademicYear } from '@/lib/utils/date';
import Image from 'next/image';
import { deleteAttendanceRecords } from '@/lib/actions/attendance';

interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  checkout_status?: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    position: string | null;
  } | null;
}

interface Props {
  initialData: AttendanceRecord[];
}

export function AttendanceTableClient({ initialData }: Props) {
  const [fileData, setFileData] = useState<AttendanceRecord[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayData = fileData || initialData;

  const handleFileUpload = (file: File) => {
    if (file.type !== 'application/json') {
      alert('Hanya file JSON yang didukung!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          setFileData(json);
        } else {
          alert('Format JSON tidak valid (harus berupa array)!');
        }
      } catch (err) {
        alert('Gagal membaca file JSON!');
      }
    };
    reader.readAsText(file);
  };

  const handleArchive = async () => {
    if (initialData.length === 0) return;
    
    const confirm = window.confirm(
      `Apakah Anda yakin ingin mengarsipkan dan MENGHAPUS ${initialData.length} data ini dari database?\n\nPastikan file JSON terdownload dengan aman!`
    );
    if (!confirm) return;

    // 1. Generate JSON and download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(initialData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `Arsip-Presensi-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    // 2. Delete from DB
    const ids = initialData.map(d => d.id);
    const result = await deleteAttendanceRecords(ids);
    
    if (result.success) {
      alert('Data berhasil diarsipkan dan dihapus dari database!');
      window.location.reload(); // Reload to fetch fresh data
    } else {
      alert(`Gagal menghapus data: ${result.error}`);
    }
  };

  return (
    <div 
      className={`space-y-6 ${isDragging ? 'opacity-50' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
      }}
    >
      {/* Upload & Info Area */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/10">
        <div>
          <h3 className="text-sm font-bold text-on-surface">
            {fileData ? '📂 Menampilkan Data Arsip (JSON)' : '📊 Menampilkan Data Database'}
          </h3>
          <p className="text-xs text-on-surface-variant opacity-60">
            {fileData ? `Total ${fileData.length} baris dari file.` : `Total ${initialData.length} baris dari database.`}
          </p>
        </div>
        <div className="flex gap-2">
          {fileData ? (
            <button 
              onClick={() => setFileData(null)}
              className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white transition-all"
            >
              Kembali ke Data Asli
            </button>
          ) : (
            <button 
              onClick={handleArchive}
              className="px-4 py-2 bg-error text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              disabled={initialData.length === 0}
            >
              Arsipkan & Hapus
            </button>
          )}
          <label className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer">
            Upload JSON Arsip
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>
        </div>
      </div>

      {/* Results Table */}
      <section className="bg-surface-container-lowest rounded-[2.5rem] overflow-hidden shadow-sm shadow-primary/5 border border-outline-variant/10">
        <div className="px-8 py-6 border-b border-surface-container-low flex justify-between items-center">
           <h3 className="text-lg font-bold text-on-surface">Data Indices</h3>
           <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Nama Anggota</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Date Index</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Masuk</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Pulang</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-70">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {displayData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline/20 mb-3 block">search_off</span>
                    <p className="text-xs font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">No matching records found</p>
                  </td>
                </tr>
              ) : (
                displayData.map(att => (
                  <tr key={att.id} className="hover:bg-surface-container-low/30 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-container-low overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-primary border border-outline-variant/5">
                          {att.profiles?.avatar_url ? (
                            <Image src={att.profiles.avatar_url} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            att.profiles?.full_name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{att.profiles?.full_name ?? 'Unknown'}</p>
                          <p className="text-[10px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">{att.profiles?.position ?? 'Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-on-surface">
                        {formatWIB(att.date, 'EEEE, d MMM')}
                      </p>
                      <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">TA {getAcademicYear(att.date)}</p>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-on-surface">{att.check_in ? formatWIB(att.check_in, 'HH:mm') : '--:--'}</span>
                          <span className="text-[9px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">Masuk</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-on-surface">{att.check_out ? formatWIB(att.check_out, 'HH:mm') : '--:--'}</span>
                          <span className="text-[9px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">Pulang</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariant(att.status)} className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                            {statusLabel(att.status)}
                          </Badge>
                        </div>
                        {att.check_out && (
                          <div className="flex items-center gap-2">
                            {(() => {
                              let coStatus = att.checkout_status;
                              if (!coStatus) {
                                const coTime = new Date(att.check_out);
                                const wibString = coTime.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour12: false });
                                const [h, m] = wibString.split(':').map(Number);
                                const isEarly = h < 12 || (h === 12 && m < 10);
                                coStatus = isEarly ? 'pulang_awal' : 'pulang_sesuai';
                              }
                              return (
                                <Badge variant={statusVariant(coStatus)} className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                  {statusLabel(coStatus)}
                                </Badge>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
