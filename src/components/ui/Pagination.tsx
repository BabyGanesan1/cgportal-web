'use client';
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps { page: number; totalPages: number; total: number; limit: number; onPageChange: (p: number) => void; }

export default function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-brand-100 bg-white">
      <span className="text-sm text-brand-500">Showing <span className="font-medium text-brand-700">{start}–{end}</span> of <span className="font-medium text-brand-700">{total}</span></span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
        {pages.map(p => <button key={p} onClick={() => onPageChange(p)} className={`w-8 h-8 text-sm rounded-lg transition-colors ${p === page ? 'bg-brand-800 text-white' : 'border border-brand-200 text-brand-600 hover:bg-brand-50'}`}>{p}</button>)}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
