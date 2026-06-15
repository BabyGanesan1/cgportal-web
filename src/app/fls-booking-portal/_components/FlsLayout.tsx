'use client';
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import AppLayout from '../../../components/layout/AppLayout';
import { useFlsTheme } from './FlsThemeContext';

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function FlsLayout({ children, title, subtitle }: Props) {
  const { isDark, toggleTheme } = useFlsTheme();

  const themeToggle = (
    <button
      onClick={toggleTheme}
      className="fls-theme-toggle"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark
        ? <><Sun className="w-3.5 h-3.5" /><span>Light</span></>
        : <><Moon className="w-3.5 h-3.5" /><span>Dark</span></>
      }
    </button>
  );

  return (
    <AppLayout title={title} subtitle={subtitle ?? ''} headerActions={themeToggle}>
      <div className={`-m-6 min-h-screen ${isDark ? 'fls-dark' : 'bg-brand-50'}`}>
        <div className="p-6">{children}</div>
      </div>
    </AppLayout>
  );
}
