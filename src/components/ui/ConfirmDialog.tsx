'use client';
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface ConfirmDialogProps { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; loading?: boolean; }

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm animate-fade-in p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
          <h3 className="font-semibold text-brand-800">{title}</h3>
        </div>
        <p className="text-sm text-brand-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="danger" size="sm" loading={loading} onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
