'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatWIB } from '@/lib/utils/date';

interface ChartData {
  date: string;
  hadir?: number;
  telat?: number;
  izin?: number;
  alpha?: number;
}

export function AttendanceChart({ data }: { data: ChartData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatted = data.map(d => ({
    ...d,
    label: formatWIB(d.date, 'd/M'),
  }));

  if (!mounted || formatted.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-[var(--text-muted)]">
        {!mounted ? 'Memuat grafik...' : 'Belum ada data untuk bulan ini.'}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={8}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="hadir" name="Hadir"      fill="var(--primary)" radius={[4,4,0,0]} />
        <Bar dataKey="telat" name="Terlambat"  fill="var(--warning)" radius={[4,4,0,0]} />
        <Bar dataKey="izin"  name="Izin"       fill="var(--info)"    radius={[4,4,0,0]} />
        <Bar dataKey="alpha" name="Alpha"      fill="var(--danger)"  radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
