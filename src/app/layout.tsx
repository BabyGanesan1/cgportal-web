import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/shared/QueryProvider';
import { Toaster } from 'react-hot-toast';
import LiveservChat from '@/components/shared/LiveservChat';
import { API_BASE } from '@/lib/api';

const isTestMode = API_BASE.includes('localhost:5000');
console.log(`Running in ${isTestMode ? 'TEST' : 'PRODUCTION'} mode (API_BASE: ${API_BASE})`);
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
        {/* Test Mode Corner Ribbon */}
        {isTestMode && (
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '240px',
            height: '240px',
            overflow: 'hidden',
            zIndex: 99999,
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '-48px',
              width: '270px',
              background: 'linear-gradient(180deg, #e77474 0%, #ce6161 100%)',
              color: '#fff',
              textAlign: 'center',
              padding: '15px 0',
              fontSize: '16px',
              fontWeight: '800',
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              transform: 'rotate(45deg)',
              boxShadow: '0 4px 18px rgba(239,68,68,0.35)',
              userSelect: 'none',
            }}>
              Test Mode
            </div>
          </div>
        )}
      </body>
    </html>
  );
}