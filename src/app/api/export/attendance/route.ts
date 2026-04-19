import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminAttendance } from '@/lib/actions/attendance';
import { generateCSV } from '@/lib/utils/csv';
import { format } from 'date-fns';

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
  const month  = searchParams.get('month') ?? format(new Date(), 'yyyy-MM');
  const userId = searchParams.get('userId') ?? undefined;

  const attendance = await getAdminAttendance({ month, userId });
  const csv        = generateCSV(attendance);
  const filename   = `absensi-${month}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
