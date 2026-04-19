'use client';

import { Download } from 'lucide-react';

interface ExportButtonProps {
  month?: string;
  userId?: string;
}

export function ExportButton({ month, userId }: ExportButtonProps) {
  const handleExport = () => {
    const params = new URLSearchParams();
    if (month)  params.set('month', month);
    if (userId) params.set('userId', userId);
    window.open(`/api/export/attendance?${params.toString()}`, '_blank');
  };

  return (
    <button onClick={handleExport} className="btn btn-secondary btn-sm gap-2">
      <Download size={16} />
      Export CSV
    </button>
  );
}
