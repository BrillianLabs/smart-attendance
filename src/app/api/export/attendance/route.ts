import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminAttendance } from '@/lib/actions/attendance';
import { format, parseISO } from 'date-fns';
import { formatWIB } from '@/lib/utils/date';
import { id as idLocale } from 'date-fns/locale';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const date   = searchParams.get('date') ?? undefined;
  const month  = searchParams.get('month') ?? formatWIB(new Date(), 'yyyy-MM');
  const userId = searchParams.get('userId') ?? undefined;

  const attendance = await getAdminAttendance({ date, month: date ? undefined : month, userId });

  // Format data for Excel
  const excelData = attendance.map((att, index) => ({
    'No': index + 1,
    'Nama Lengkap': att.profiles?.full_name ?? 'N/A',
    'Jabatan': att.profiles?.position ?? '-',
    'Tanggal': format(parseISO(att.date), 'dd/MM/yyyy'),
    'Jam Masuk': att.check_in ? format(parseISO(att.check_in), 'HH:mm') : '-',
    'Jam Pulang': att.check_out ? format(parseISO(att.check_out), 'HH:mm') : '-',
    'Status': att.status.toUpperCase(),
    'Keterangan': att.note ?? ''
  }));

  // Create Workbook & Worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Presensi');

  // Fix column widths
  const wscols = [
    { wch: 5 },  // No
    { wch: 25 }, // Nama
    { wch: 20 }, // Jabatan
    { wch: 12 }, // Tanggal
    { wch: 10 }, // Masuk
    { wch: 10 }, // Pulang
    { wch: 12 }, // Status
    { wch: 30 }, // Keterangan
  ];
  worksheet['!cols'] = wscols;

  // Generate Buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const filename = `Laporan-Presensi-${month}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
