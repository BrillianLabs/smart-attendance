import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { Toaster } from 'react-hot-toast';
import { getSettings } from '@/lib/actions/admin';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const materialSymbols = localFont({
  src: '../assets/fonts/material-symbols.woff2',
  variable: '--font-material-symbols',
  display: 'block',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const name = settings?.school_name ?? 'e-Absensi';
  return {
    title: { default: name, template: `%s | ${name}` },
    description: `Sistem manajemen kehadiran online ${name}`,
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${materialSymbols.variable} antialiased`}>
      <head>
        {/* Google Fonts preconnect for Inter is automatic with next/font, 
            tetapi kita melakukan self-host untuk Material Symbols demi kecepatan maksimal. */}
      </head>
      <body className={`${inter.className} font-sans`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
            },
          }}
        />
      </body>
    </html>
  );
}
