import { describe, it, expect, vi } from 'vitest';

// Mock next/cache
vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn, // Just return the function directly
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => {
  const mockSingle = vi.fn().mockResolvedValue({ data: { school_name: 'Mock School' } });
  const mockEq = vi.fn().mockReturnThis();
  const mockSelect = vi.fn().mockReturnThis();
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    maybeSingle: mockSingle,
  });

  return {
    createClient: vi.fn().mockReturnValue({
      from: mockFrom,
    }),
  };
});

// Now import the function to test
import { getSettings } from '@/lib/actions/admin';

describe('getSettings Caching Action', () => {
  it('should fetch settings from Supabase', async () => {
    const settings = await getSettings();
    
    expect(settings).toEqual({ school_name: 'Mock School' });
  });
});
