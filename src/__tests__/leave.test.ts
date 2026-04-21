import { describe, it, expect } from 'vitest';

// Simulating the leave status logic
function getLeaveStatusLabel(status: string) {
  switch (status) {
    case 'pending': return 'Menunggu Persetujuan';
    case 'approved': return 'Disetujui';
    case 'rejected': return 'Ditolak';
    default: return status;
  }
}

describe('Leave Request Logic', () => {
  it('should return correct labels for leave status', () => {
    expect(getLeaveStatusLabel('pending')).toBe('Menunggu Persetujuan');
    expect(getLeaveStatusLabel('approved')).toBe('Disetujui');
    expect(getLeaveStatusLabel('rejected')).toBe('Ditolak');
  });

  it('should correctly calculate date range overlapping (simplified)', () => {
    const isOverlapping = (start1: Date, end1: Date, start2: Date, end2: Date) => {
      return start1 <= end2 && start2 <= end1;
    };

    const s1 = new Date('2024-04-01');
    const e1 = new Date('2024-04-10');
    
    // Test overlapping
    expect(isOverlapping(s1, e1, new Date('2024-04-05'), new Date('2024-04-15'))).toBe(true);
    // Test not overlapping
    expect(isOverlapping(s1, e1, new Date('2024-04-11'), new Date('2024-04-20'))).toBe(false);
  });
});
