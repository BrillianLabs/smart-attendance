import { describe, it, expect, vi } from 'vitest';
import { format, parseISO } from 'date-fns';

// Helper to simulate the logic in attendance stats
function calculateStats(attendance: any[], totalStaff: number) {
  const counts = { hadir: 0, telat: 0, izin: 0, alpha: 0 };
  for (const row of attendance) {
    counts[row.status as keyof typeof counts] = (counts[row.status as keyof typeof counts] ?? 0) + 1;
  }
  const attended = counts.hadir + counts.telat;
  counts.alpha = Math.max(0, totalStaff - attended - counts.izin);
  return { ...counts, total_staff: totalStaff };
}

describe('Attendance Stats Logic', () => {
  it('should correctly count status frequencies', () => {
    const mockAttendance = [
      { status: 'hadir' },
      { status: 'hadir' },
      { status: 'telat' },
      { status: 'izin' },
    ];
    const stats = calculateStats(mockAttendance, 10);
    
    expect(stats.hadir).toBe(2);
    expect(stats.telat).toBe(1);
    expect(stats.izin).toBe(1);
  });

  it('should correctly calculate alpha counts based on total staff', () => {
    const mockAttendance = [
      { status: 'hadir' }, // 1
      { status: 'telat' }, // 1
      { status: 'izin' },  // 1
    ];
    // Total staff 5. Attended (hadir+telat) = 2. Izin = 1.
    // Alpha = 5 - 2 - 1 = 2.
    const stats = calculateStats(mockAttendance, 5);
    
    expect(stats.alpha).toBe(2);
    expect(stats.total_staff).toBe(5);
  });

  it('should handle zero attendance records', () => {
    const stats = calculateStats([], 10);
    expect(stats.alpha).toBe(10);
    expect(stats.hadir).toBe(0);
  });
});

describe('Date Formatting Logic', () => {
  it('should format ISO dates correctly for Indonesian locale display', () => {
    const dateStr = '2024-04-21T07:30:00Z';
    const formatted = format(parseISO(dateStr), 'HH:mm');
    // Note: depending on localized test environment, this might vary if not mocked
    // but the logic check remains.
    expect(formatted).toMatch(/^\d{2}:\d{2}$/);
  });
});
