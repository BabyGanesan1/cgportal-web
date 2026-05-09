'use client';
import { useState, useRef } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Upload, Loader2, Download } from 'lucide-react';
import Modal from './Modal';

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({
  open, onClose, onConfirm, title, message, loading = false, variant = 'danger'
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; loading?: boolean; variant?: 'danger' | 'warning';
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3 mb-5">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'}`}>
          <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-red-600' : 'text-amber-600'}`} />
        </div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Confirm
        </button>
      </div>
    </Modal>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, total, limit, onPageChange }: {
  page: number; total: number; limit: number; onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return start + i;
  });

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-brand-700">{(page - 1) * limit + 1}</span>–
        <span className="font-medium text-brand-700">{Math.min(page * limit, total)}</span> of{' '}
        <span className="font-medium text-brand-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed text-brand-700 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map(p => (
          <button key={p} onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-brand-700 text-white' : 'hover:bg-surface text-brand-700'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed text-brand-700 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Bulk Upload Button ───────────────────────────────────────────────────────
export function BulkUploadButton({ onUpload, loading, templateUrl }: {
  onUpload: (file: File) => void; loading?: boolean; templateUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { onUpload(file); e.target.value = ''; }
  };
  return (
    <div className="flex items-center gap-2">
      {templateUrl && (
        <a href={templateUrl} download className="btn-secondary gap-1.5 text-xs py-2 px-3">
          <Download className="w-3.5 h-3.5" /> Template
        </a>
      )}
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
      <button onClick={() => inputRef.current?.click()} disabled={loading} className="btn-secondary gap-1.5 text-xs py-2 px-3">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        Bulk Upload
      </button>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  let cls = 'bg-gray-100 text-gray-700 border-gray-200';
  if (s.includes('vacant') || s.includes('open for sale') || s.includes('investor')) cls = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  else if (s.includes('sold')) cls = 'bg-red-100 text-red-700 border-red-200';
  else if (s.includes('block')) cls = 'bg-amber-100 text-amber-700 border-amber-200';
  else if (s.includes('hold')) cls = 'bg-blue-100 text-blue-700 border-blue-200';
  return <span className={`badge ${cls}`}>{status || '—'}</span>;
}
