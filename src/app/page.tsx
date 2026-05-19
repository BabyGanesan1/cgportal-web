'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getAdmin } from '../lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const admin = getAdmin();

    if (admin?.role === 'admin') {
      // FLS department users go directly to their portal — no main dashboard
      const flsDeptMap: Record<string, string> = {
        'FLS-Booking': '/fls-booking-portal/booking',
        'FLS-Checking': '/fls-booking-portal/checking',
        'FLS-Source': '/fls-booking-portal/source',
      };
      if (admin.department && flsDeptMap[admin.department]) {
        router.replace(flsDeptMap[admin.department]);
        return;
      }

      if (admin.owner === false && admin.zonal) {
        router.replace(`/${admin.zonal}/dashboard`);
      } else {
        router.replace('/dashboard');
      }
    } else if (admin?.role === 'user' && admin?.department === 'sales') {
      router.replace('/sales-portal');
    } else {
      router.replace('/portal/properties');
    }
  }, [router]);

  return null;
}