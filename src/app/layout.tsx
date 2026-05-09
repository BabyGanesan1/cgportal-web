import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/shared/QueryProvider';
import { Toaster } from 'react-hot-toast';
import LiveservChat from '@/components/shared/LiveservChat';

export const metadata: Metadata = {
  title: 'CG Property Admin',
  description: 'CG Property Management Admin Panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* cg property portal added*/}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-brand-50">
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 2000,
            style: { borderRadius: '10px', background: '#102a43', color: '#fff', fontSize: '14px' },
            success: { iconTheme: { primary: '#f59e0b', secondary: '#fff' } },
          }}
        />
        {/* Livserv Casagrand Chat Widget */}
        <LiveservChat />
      </body>
    </html>
  );
}