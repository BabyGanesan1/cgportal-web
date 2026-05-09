'use client';
import React from 'react';
import { Edit2, Trash2, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';
import Pagination from '../ui/Pagination';

interface Column { key: string; label: string; render?: (row: any, onRefresh?: () => void) => React.ReactNode; }

interface MasterTableProps {
  data: any[];
  columns: Column[];
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onRestore?: (item: any) => void;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function MasterTable({ data, columns, onEdit, onDelete, onRestore, page, totalPages, total, limit, onPageChange, loading, onRefresh }: MasterTableProps) {
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
    </div>
  );

  if (!data.length) return (
    <div className="text-center py-16 text-brand-400">
      <div className="text-4xl mb-3">📋</div>
      <p className="font-medium">No records found</p>
    </div>
  );

  return (
    <div className="rounded-xl overflow-hidden border border-brand-100 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>#</th>
              {columns.map(col => <th key={col.key}>{col.label}</th>)}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.id} className="animate-fade-in">
                <td className="text-brand-400">{(page - 1) * limit + idx + 1}</td>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row, onRefresh) : (row[col.key] || '-')}
                  </td>
                ))}
                <td>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {onRestore && (
                      <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => onRestore(row)} title="Restore to previous version" />
                    )}
                    <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => onEdit(row)} />
                    <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => onDelete(row)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={onPageChange} />
    </div>
  );
}