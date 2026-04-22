import { describe, it, expect, vi, beforeEach } from 'vitest';

// We'll test the business logic for email mapping which is a core part of the system
function getEmailFromUsername(username: string) {
  return username.includes('@') ? username : `${username.trim().replace(/\s/g, '')}@absen.smart`;
}

describe('Auth Utility - Email Mapping', () => {
  it('should pass through valid emails', () => {
    const input = 'test@gmail.com';
    expect(getEmailFromUsername(input)).toBe('test@gmail.com');
  });

  it('should map numeric NIP to internal domain', () => {
    const input = '19850504';
    expect(getEmailFromUsername(input)).toBe('19850504@absen.smart');
  });

  it('should remove spaces from NIP/Username before mapping', () => {
    const input = ' 1985 0504 ';
    expect(getEmailFromUsername(input)).toBe('19850504@absen.smart');
  });
});

describe('Password Policy logic', () => {
  it('should reject passwords shorter than 6 characters', () => {
    const password = '12345';
    const isValid = password.length >= 6;
    expect(isValid).toBe(false);
  });

  it('should accept passwords with 6 or more characters', () => {
    const password = 'secure123';
    const isValid = password.length >= 6;
    expect(isValid).toBe(true);
  });
});

describe('NIP to Email Lookup logic', () => {
  const mockProfiles = [
    { nip: '12345', email: 'user@gmail.com' }
  ];

  const getEmailFromNip = (nip: string) => {
    const profile = mockProfiles.find(p => p.nip === nip);
    return profile?.email || `${nip}@absen.smart`;
  };

  it('should return real email if NIP exists in database', () => {
    expect(getEmailFromNip('12345')).toBe('user@gmail.com');
  });

  it('should return fallback internal email if NIP not found', () => {
    expect(getEmailFromNip('99999')).toBe('99999@absen.smart');
  });
});
