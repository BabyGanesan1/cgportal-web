'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../components/layout/AppLayout';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

const TABLE_COLUMNS = [
  { key: 'project', label: 'Project' },
  { key: 'unit_no', label: 'Unit No' },
  { key: 'name', label: 'Customer Name' },
  { key: 'login_counter_date', label: 'Login Counter Date', isDate: true },
  { key: 'fls_id', label: 'FLS ID' },
  { key: 'fls_name', label: 'FLS Name' },
];

function formatDate(val: string) {
  if (!val) return '-';
  return new Date(val).toLocaleDateString('en-GB');
}

export default function FlsBookingListPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: PAGE_SIZE, search, date_field: 'login_counter_date' };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get('/fls-booking', { params });
      setData(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load booking data');
    } finally {
      setLoading(false);
    }
  }, [page, search, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (row: any) => {
    if (!window.confirm(`Delete booking for "${row.name || row.unit_no || 'this record'}"?`)) return;
    setDeleting(row.id);
    try {
      await api.delete(`/fls-booking/${row.id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AppLayout title="FLS Booking" subtitle="Manage FLS booking details">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-end">
            <div className="flex flex-wrap gap-2 items-end flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                  placeholder="Search project, name, unit..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">From</label>
                <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">To</label>
                <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
              </div>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-50">
                  Clear Dates
                </button>
              )}
            </div>
            <button onClick={() => router.push('/fls-booking-portal/booking/add')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">#</th>
                  {TABLE_COLUMNS.map(col => (
                    <th key={col.key} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">{col.label}</th>
                  ))}
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={TABLE_COLUMNS.length + 2} className="text-center py-12 text-gray-400">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={TABLE_COLUMNS.length + 2} className="text-center py-12 text-gray-400">No records found</td></tr>
                ) : data.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    {TABLE_COLUMNS.map(col => (
                      <td key={col.key} className="px-4 py-3 text-gray-800 whitespace-nowrap">
                        {col.isDate ? formatDate(row[col.key]) : (row[col.key] ?? '-')}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => router.push(`/fls-booking-portal/booking/${row.id}/edit`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row)} disabled={deleting === row.id}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">Total: <strong>{total}</strong> records</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
