'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { isAuthenticated, getAdmin, clearAuth } from '../../lib/auth';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export default function AppLayout({ children, title, subtitle, headerActions }: AppLayoutProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const currentPath = window.location.pathname;
    const isPortalRoute = currentPath.startsWith('/portal/');

    // Portal routes are public — never redirect unauthenticated users away
    if (isPortalRoute) return;

    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const user = getAdmin();

    // FLS users are restricted to their own section only
    const flsAllowedPath: Record<string, string> = {
      'FLS-Booking': '/fls-booking-portal/booking',
      'FLS-Checking': '/fls-booking-portal/checking',
      'FLS-Source': '/fls-booking-portal/source',
    };
    if (user?.department && flsAllowedPath[user.department]) {
      const allowedBase = flsAllowedPath[user.department];
      if (!currentPath.startsWith(allowedBase)) {
        router.replace(allowedBase);
        return;
      }
    }
    const adminOnlyPaths = ['/dashboard', '/masters', '/users', '/activity-logs', '/projects', '/project-locations', '/handover-details', '/units', '/unit-status', '/payment-schedules', '/bulk-upload-history'];
    
    // Helper to strip zonal prefix for checking path matches properly
    const match = currentPath.match(/^\/(chennai|banglore|hydrabad|combatore|dubai|pune)(\/.*)?$/);
    const pathZonal = match ? match[1] : null;
    const pathWithoutZonal = match ? (match[2] || '/dashboard') : currentPath;

    const isAdminPath = adminOnlyPaths.some(path => pathWithoutZonal === path || pathWithoutZonal.startsWith(path + '/'));

    if (user?.role !== 'admin' && isAdminPath) {
      router.replace('/portal/properties');
      return;
    }

    if (user?.role === 'admin' && isAdminPath) {
      // 1. owner=true can access /users. others (including normal admin) cannot.
      if (pathWithoutZonal.startsWith('/users')) {
        if (user.owner !== true) {
          router.replace('/dashboard');
          return;
        }
      }

      // 2. For owner=false admins that have a zonal assigned, they must be on their zonal route
      if (user.owner === false && user.zonal) {
        if (!pathZonal) {
          // Navigated directly without zonal, prepend it
          router.replace(`/${user.zonal}${pathWithoutZonal}`);
          return;
        } else if (pathZonal !== user.zonal) {
          // Out of your zonal, automatically logout
          clearAuth();
          window.location.href = '/login';
          return;
        }
      }
    }
  }, [mounted, router]);

  // Read auth state only after mount (localStorage is client-only)
  const admin = mounted ? getAdmin() : null;
  const isAdmin = admin?.role === 'admin';
  const isFLSUser = ['FLS-Booking', 'FLS-Checking', 'FLS-Source'].includes(admin?.department || '');

  const shouldShowSidebar = mounted && isAdmin && !isFLSUser;

  return (
    <div className="flex h-screen bg-brand-50 overflow-hidden">
      {shouldShowSidebar && <Sidebar />}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header title={title} subtitle={subtitle} isAdmin={isAdmin} headerActions={headerActions} />
        <div className={`flex-1 overflow-y-auto ${isAdmin ? 'p-6' : 'p-0 md:p-10'}`}>
          <div className={isAdmin ? '' : 'max-w-7xl mx-auto w-full'}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}