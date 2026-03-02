import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Huball — Migrate any website to HubSpot',
  description: 'Paste a URL and get a complete HubSpot CMS theme in seconds',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
