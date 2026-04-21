import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { Toaster } from 'react-hot-toast';
import { getSettings } from '@/lib/actions/admin';
import { ConfirmProvider } from '@/context/ConfirmContext';

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
  const name = settings?.school_name || 'SIGAP';
  return {
    title: { default: name, template: `%s | ${name}` },
    description: `Sistem Informasi Guru Absensi Pintar - ${name}`,
    icons: {
      icon: settings?.school_logo_url || '/logo-256.webp',
      apple: settings?.school_logo_url || '/logo-256.webp',
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${materialSymbols.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Google Fonts preconnect for Inter is automatic with next/font, 
            tetapi kita melakukan self-host untuk Material Symbols demi kecepatan maksimal. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && supportDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} font-sans`}>
        <ConfirmProvider>
          {children}
          <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--color-surface-container-lowest)',
              color: 'var(--color-on-surface)',
              borderRadius: '1.25rem',
              border: '1px solid var(--color-outline-variant)',
              padding: '1rem 1.5rem',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            },
            success: {
              iconTheme: {
                primary: 'var(--color-primary)',
                secondary: 'var(--color-surface-container-lowest)',
              },
            },
          }}
        />
        </ConfirmProvider>
      </body>
    </html>
  );
}
