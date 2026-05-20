'use client';
import React from 'react';
import AppLayout from '../../../components/layout/AppLayout';

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function FlsLayout({ children, title, subtitle }: Props) {
  return (
    <AppLayout title={title} subtitle={subtitle ?? ''}>
      <div className="-m-6 min-h-screen bg-brand-50">
        <div className="p-6">{children}</div>
      </div>
    </AppLayout>
  );
}
