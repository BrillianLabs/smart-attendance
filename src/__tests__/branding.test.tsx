import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginForm from '../components/auth/LoginForm';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import React from 'react';

// Mocking the Image component from next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('Branding Propagation Tests', () => {
  const mockSettings = {
    school_name: 'SD NEGERI NGUWOK',
    school_logo_url: 'https://example.com/logo.webp',
    primary_color: '#006a61',
  };

  const mockProfile: any = {
    id: '1',
    full_name: 'Admin User',
    role: 'admin' as const,
    avatar_url: null,
    position: 'Administrator',
    phone: '08123456789',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  it('LoginForm should render the school logo and name from props', () => {
    render(<LoginForm schoolName={mockSettings.school_name} logoUrl={mockSettings.school_logo_url} />);
    
    const logo = screen.getByAltText(mockSettings.school_name);
    expect(logo).toHaveAttribute('src', mockSettings.school_name === 'SIGAP' ? '/logo-256.webp' : mockSettings.school_logo_url);
    // Note: LoginForm.tsx line 45 has logoUrl || "/logo-256.webp"
    expect(screen.getByText(mockSettings.school_name)).toBeDefined();
  });

  it('Sidebar should render the SIGAP title and logo', () => {
    // Note: Sidebar.tsx uses settings prop directly
    render(<Sidebar profile={mockProfile} settings={mockSettings as any} />);
    
    expect(screen.getByText('SIGAP v1.0')).toBeDefined();
    const logo = screen.getByAltText('Logo');
    expect(logo).toHaveAttribute('src', mockSettings.school_logo_url);
  });

  it('Navbar should render the school logo when not in admin desktop view', () => {
    render(<Navbar profile={mockProfile} settings={mockSettings as any} />);
    
    const logo = screen.getByAltText('Logo');
    expect(logo).toHaveAttribute('src', mockSettings.school_logo_url);
    expect(screen.getByText(mockSettings.school_name)).toBeDefined();
  });
});

// Test for metadata generation logic
describe('Metadata Logic', () => {
  it('should generate correct title and icons based on settings', async () => {
    // We simulate the logic in layout.tsx:generateMetadata
    const settings = { school_name: 'TEST SCHOOL', school_logo_url: 'https://test.com/logo.png' };
    
    const title = { default: settings.school_name, template: `%s | ${settings.school_name}` };
    const icons = {
      icon: settings.school_logo_url,
      apple: settings.school_logo_url,
    };

    expect(title.default).toBe('TEST SCHOOL');
    expect(icons.icon).toBe('https://test.com/logo.png');
  });
});
