import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Fix for 'Error: Not implemented: window.scrollTo' in JSDOM
window.scrollTo = vi.fn();

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  redirect: vi.fn(),
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
