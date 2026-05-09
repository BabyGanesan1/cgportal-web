'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'; }
const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '4xl': 'max-w-4xl' };

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${sizes[size]} animate-fade-in max-h-[90vh] flex flex-col overflow-y-auto custom-scrollbar`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-100 bg-gradient-to-r from-brand-800 to-brand-700 rounded-t-xl sticky top-0 z-10">
          <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 p-6 overflow-visible">{children}</div>
      </div>
    </div>
  );
}
