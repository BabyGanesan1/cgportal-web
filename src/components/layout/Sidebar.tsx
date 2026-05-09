'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAdmin, clearAuth } from '../../lib/auth';
import { LayoutDashboard, Building2, ChevronDown, ChevronRight, LogOut, Users, Settings, Database, MapPin, Map, Home, Calculator, List, Car, Layers, ChevronLeft, History, Upload } from 'lucide-react';
import { getDirectImageUrl } from '../../lib/utils';

type NavItem = {
  href?: string;
  label: string;
  icon: any;
  role?: string;
  children?: { href: string; label: string; icon: any }[];
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'admin' },
  { href: '/projects', label: 'Projects', icon: Building2, role: 'admin' },
  { href: '/project-locations', label: 'Project Locations', icon: MapPin, role: 'admin' },
  { href: '/handover-details', label: 'Handover Details', icon: History, role: 'admin' },
  { href: '/units', label: 'Project & Units', icon: Home, role: 'admin' },
  { href: '/unit-status', label: 'Unit Status Update', icon: Layers, role: 'admin' },
  { href: '/payment-schedules', label: 'Payment Schedules', icon: Calculator, role: 'admin' },
  /*
  {
    label: 'Masters',
    icon: Settings,
    role: 'admin',
    children: [
      { href: '/masters/cities', label: 'Cities', icon: MapPin },
      { href: '/masters/locations', label: 'Locations', icon: MapPin },
      { href: '/masters/serving-locations', label: 'Serving Locations', icon: MapPin },
      { href: '/masters/bhk-types', label: 'BHK Types', icon: Home },
      { href: '/masters/bhk-details', label: 'BHK Details', icon: Home },
      { href: '/masters/possession-statuses', label: 'Possession Status', icon: List },
      { href: '/masters/car-park-types', label: 'Car Park Types', icon: Car },
      { href: '/masters/unit-statuses', label: 'Unit Statuses', icon: Layers },
      { href: '/masters/payment-schedules', label: 'Payment Schedules', icon: Calculator },
    ]
  },
  */
  { href: '/users', label: 'Users', icon: Users, role: 'admin' },
  { href: '/portal/properties', label: 'Properties (Portal)', icon: Building2, role: 'admin' },
  { href: '/activity-logs', label: 'Activity Logs', icon: History, role: 'admin' },
  { href: '/bulk-upload-history', label: 'Bulk Upload History', icon: Upload, role: 'admin' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mastersOpen, setMastersOpen] = useState(pathname.startsWith('/masters'));

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-gradient-to-b from-brand-900 to-brand-800 h-screen flex flex-col shadow-xl flex-shrink-0`}>
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-6'} py-5 border-b border-white/10`}>
        {!collapsed && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center">
              <img
                src="/assets/images/cg_logo.png"
                alt="Casagrand"
                referrerPolicy="no-referrer"
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-white/30 text-[9px] uppercase tracking-[0.4em] font-black pl-1">Admin Panel</p>
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center">
            <img
              src="/assets/images/cg_logo.png"
              alt="CG"
              referrerPolicy="no-referrer"
              className="w-10 h-10 object-contain brightness-0 invert opacity-60"
            />
          </div>
        )}
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.filter(item => {
          const admin = getAdmin();
          if (item.role && item.role !== admin?.role) return false;
          if (admin?.role === 'admin' && admin?.owner !== true) {
            if (item.label === 'Users') return false;
          }
          return true;
        }).map((item) => {
          const admin = getAdmin();
          const prefix = (admin?.role === 'admin' && admin?.owner === false && admin?.zonal) ? `/${admin.zonal}` : '';

          if ('children' in item) {
            const isActive = pathname.startsWith('/masters');
            return (
              <div key="masters">
                <button onClick={() => setMastersOpen(o => !o)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive ? 'text-yellow-300 bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (<><span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${mastersOpen ? 'rotate-90' : ''}`} /></>)}
                </button>
                {mastersOpen && !collapsed && (
                  <div className="ml-4 border-l border-white/10">
                    {item.children?.map(child => (
                      <Link key={child.href} href={child.href}
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${pathname === child.href ? 'text-yellow-300 bg-white/10 border-r-2 border-yellow-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                        <child.icon className="w-4 h-4 flex-shrink-0" /><span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          let targetHref = item.href ? `${prefix}${item.href}` : '#';
          const isActive = pathname === targetHref || (item.href && pathname.startsWith(targetHref + '/'));
          return (
            <Link key={item.href} href={targetHref}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive ? 'text-yellow-300 bg-white/10 border-r-2 border-yellow-400' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button onClick={() => setCollapsed(c => !c)} className="w-full flex items-center justify-center p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 mb-2 transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-red-300 hover:bg-red-500/10 text-sm transition-colors">
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}