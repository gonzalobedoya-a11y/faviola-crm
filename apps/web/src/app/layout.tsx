import type { Metadata } from 'next';
import { Great_Vibes, IBM_Plex_Mono, Inter, Playfair_Display } from 'next/font/google';
import type { ReactNode } from 'react';

import '../styles/globals.css';
import { Providers } from './providers';

const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
const script = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-script',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Faviola Velarde CRM',
  description: 'Asesoría patrimonial inmobiliaria — plataforma de gestión inteligente.',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} ${script.variable}`}
    >
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
