import { describe, it, expect } from 'vitest';

// Logic for generating default email from NIP
function generateEmailFromNip(nip: string) {
  return `${nip.trim()}@absen.smart`;
}

describe('Profile Utility Logic', () => {
  it('should generate internal email correctly from NIP', () => {
    expect(generateEmailFromNip('19900101')).toBe('19900101@absen.smart');
  });

  it('should handle whitespace in NIP', () => {
    expect(generateEmailFromNip('  19900101  ')).toBe('19900101@absen.smart');
  });
});

describe('Role Check logic', () => {
  const checkAccess = (role: string, targetRole: string) => {
    if (role === 'admin') return true;
    return role === targetRole;
  };

  it('should allow admin to access anything', () => {
    expect(checkAccess('admin', 'staff')).toBe(true);
    expect(checkAccess('admin', 'admin')).toBe(true);
  });

  it('should restrict staff access to admin features', () => {
    expect(checkAccess('staff', 'admin')).toBe(false);
    expect(checkAccess('staff', 'staff')).toBe(true);
  });
});
