'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ExportButtonProps {
  month?: string;
  userId?: string;
  date?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ExportButton({ month, userId, date, className, children }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    
    const params = new URLSearchParams();
    if (date)   params.set('date', date);
    if (month)  params.set('month', month);
    if (userId) params.set('userId', userId);
    
    setIsExporting(true);
    const loadingToast = toast.loading('Menyiapkan file Excel...');

    try {
      const response = await fetch(`/api/export/attendance?${params.toString()}`);
      if (!response.ok) throw new Error('Gagal mengunduh file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Try to get filename from header or fallback
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Laporan-Presensi.xlsx`;
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) filename = matches[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Laporan berhasil diunduh', { id: loadingToast });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Terjadi kesalahan saat mengekspor data', { id: loadingToast });
    } finally {
      setIsExporting(false);
    }
  };

  if (children) {
    return (
      <button 
        onClick={handleExport} 
        className={className}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="animate-spin text-sm" size={14} />
        ) : children}
      </button>
    );
  }

  return (
    <button 
      onClick={handleExport} 
      className={className ?? "btn btn-secondary btn-sm gap-2"}
      disabled={isExporting}
    >
      {isExporting ? (
        <>
          <Loader2 className="animate-spin" size={16} />
          Memproses...
        </>
      ) : (
        <>
          <Download size={16} />
          Export Excel
        </>
      )}
    </button>
  );
}
