'use client';
import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, LogOut, ChevronDown } from 'lucide-react';
import { getAdmin, clearAuth } from '../../lib/auth';
import Link from 'next/link';

interface HeaderProps { title: string; subtitle?: string; isAdmin?: boolean; headerActions?: React.ReactNode; }

export default function Header({ title, subtitle, isAdmin = true, headerActions }: HeaderProps) {
  const [admin, setAdmin] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAdmin(getAdmin());
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  // ─── Portal (non-admin) header ────────────────────────────────────────────
  if (!isAdmin) {
    const isLoggedIn = !!admin;

    return (
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-brand-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/portal/properties" className="flex flex-col gap-0.5 group">
            <img
              src="/assets/images/casagrand_logo.png"
              alt="Casagrand"
              referrerPolicy="no-referrer"
              className="h-8 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <p className="text-[9px] uppercase tracking-[0.3em] text-brand-400 font-black pl-1">Premium Living</p>
          </Link>

          {mounted && isLoggedIn && (
            <div className="flex items-center gap-3" ref={dropdownRef}>
              {/* User info pill */}
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-brand-100 bg-white hover:bg-brand-50 transition-all"
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-black"
                  style={{ background: '#0a1628' }}
                >
                  {admin?.name ? admin.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>

                {/* Text — hidden on very small screens */}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-brand-800 leading-tight">{admin?.email}</p>
                  {admin?.employee_id && (
                    <p className="text-[10px] text-brand-400 font-medium leading-tight">
                      EMP: {admin.employee_id}
                    </p>
                  )}
                </div>

                <ChevronDown
                  className="w-3.5 h-3.5 text-brand-400 transition-transform"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  className="absolute right-6 top-16 w-56 bg-white rounded-2xl shadow-xl border border-brand-50 z-50 overflow-hidden"
                  style={{ boxShadow: '0 8px 32px rgba(10,22,40,0.12)' }}
                >
                  {/* User details block */}
                  <div className="px-4 py-3 border-b border-brand-50">
                    <p className="text-xs font-bold text-brand-800 truncate">{admin?.name}</p>
                    <p className="text-[11px] text-brand-500 truncate mt-0.5">{admin?.email}</p>
                    {admin?.employee_id && (
                      <p className="text-[11px] text-brand-400 mt-0.5 font-medium">
                        Emp ID: <span className="font-bold text-brand-700">{admin.employee_id}</span>
                      </p>
                    )}
                    {admin?.role && (
                      <span
                        className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                        style={{ background: '#f59e0b20', color: '#b45309' }}
                      >
                        {admin.role}
                      </span>
                    )}
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    );
  }

  // ─── Admin header ─────────────────────────────────────────────────────────
  return (
    <header className="bg-white border-b border-brand-100 px-6 py-4 flex items-center justify-between">
      <div>
        {/* test */}
        <h1 className="font-display text-xl font-semibold text-brand-900">{title}</h1>
        {subtitle && <p className="text-sm text-brand-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {headerActions}
        <button className="p-2 rounded-lg text-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        {mounted ? (
          <div className="flex items-center gap-2 pl-3 border-l border-brand-100" ref={dropdownRef}>
            {/* Avatar */}
            <div className="w-8 h-8 bg-brand-800 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-black">
              {admin?.name ? admin.name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-white" />}
            </div>

            {/* Info */}
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-brand-800">{admin?.name || 'User'}</p>
                <span className="px-1.5 py-0.5 bg-brand-50 text-[10px] font-bold text-brand-400 rounded-md uppercase tracking-wider">
                  {admin?.role}
                </span>
              </div>
              <p className="text-xs text-brand-400">
                {admin?.email}
                {admin?.employee_id && (
                  <span className="ml-2 font-bold text-brand-500">· {admin.employee_id}</span>
                )}
              </p>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="ml-2 p-2 rounded-lg text-brand-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 bg-brand-50 rounded-full animate-pulse ml-3"></div>
        )}
      </div>
    </header>
  );
}
