import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { HirfaToaster } from '@/components/ui/Toast'
import { AppSettingsProvider } from '@/lib/theme'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'حِرفة',
  description: 'سوق الحرف اليدوية والفنون',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'حِرفة' },
  other: { 'mobile-web-app-capable': 'yes' },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        <meta name="theme-color" content="#C0392B" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js')); }`,
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('hirfa_theme')||'light';function apply(t){var d=t==='dark'||(t==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}apply(t);if(t==='auto'){window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){apply('auto');});}}catch(e){}})();` }} />
        <AppSettingsProvider>{children}</AppSettingsProvider>
        <HirfaToaster />
      </body>
    </html>
  )
}
