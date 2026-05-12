import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStaffUser } from '@/lib/actions/admin';

// Use vi.hoisted to avoid reference errors during hoisting
const mocks = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      admin: {
        createUser: mocks.mockCreateUser,
      },
    },
    from: vi.fn().mockReturnValue({
      update: mocks.mockUpdate,
    }),
  }),
}));

vi.mock('@/lib/actions/auth', () => ({
  isAdmin: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('createStaffUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock behavior
    mocks.mockCreateUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
    mocks.mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it('should create a staff user successfully', async () => {
    const result = await createStaffUser(
      'testuser',
      'password123',
      'Test User',
      'staff',
      'Teacher',
      '199001012023011001'
    );

    expect(result).toEqual({ success: true, data: undefined });
    expect(mocks.mockCreateUser).toHaveBeenCalled();
  });

  it('should return error if Supabase Auth fails (e.g. duplicate email)', async () => {
    mocks.mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already exists' },
    });

    const result = await createStaffUser(
      'testuser',
      'password123',
      'Test User',
      'staff'
    );

    expect(result).toEqual({ success: false, error: 'User already exists' });
  });

  it('should return error if not admin', async () => {
    const { isAdmin } = await import('@/lib/actions/auth');
    (isAdmin as any).mockResolvedValue(false);

    const result = await createStaffUser(
      'testuser',
      'password123',
      'Test User',
      'staff'
    );

    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
  });
});
