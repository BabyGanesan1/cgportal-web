'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Trash2, ChevronLeft, ChevronRight, BarChart2, Users, Layers, FileText, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FlsLayout from '../_components/FlsLayout';
import FlsFilter from '../_components/FlsFilter';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

const TABLE_COLUMNS = [
  { key: 'project', label: 'Project' },
  { key: 'unit_no', label: 'Unit No' },
  { key: 'name', label: 'Customer Name' },
  { key: 'login_counter_date', label: 'Login Date', isDate: true },
  { key: 'fls_id', label: 'FLS ID' },
  { key: 'fls_name', label: 'FLS Name' },
];


function formatDate(val: string) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-GB');
}

export default function FlsBookingListPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [unitNo, setUnitNo] = useState('');
  const [flsAgent, setFlsAgent] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const buildParams = useCallback((overridePage?: number) => {
    const params: any = {
      page: overridePage ?? page,
      limit: PAGE_SIZE,
      search, unit_no: unitNo, fls_agent: flsAgent,
      customer_name: customerName, date_field: 'createdAt',
    };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    return params;
  }, [page, search, unitNo, flsAgent, customerName, dateFrom, dateTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/fls-booking', { params: buildParams() });
      setData(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch { toast.error('Failed to load booking data'); }
    finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const resetPage = () => setPage(1);

  const handleDelete = async (row: any) => {
    if (!window.confirm(`Delete booking for "${row.name || row.unit_no || 'this record'}"?`)) return;
    setDeleting(row.id);
    try {
      await api.delete(`/fls-booking/${row.id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { ...buildParams(1), limit: 10000, type: 'booking' };
      const res = await api.get('/fls-booking/export', { params, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fls_booking_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported successfully');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const uniqueFls = Array.from(new Set(data.map(r => r.fls_id).filter(Boolean))).length;

  const stats = [
    { label: 'Total Records', value: total, icon: BarChart2, color: 'text-blue-400', bg: 'bg-blue-500/10', bar: 'bg-blue-500' },
    { label: 'This Page', value: data.length, icon: Layers, color: 'text-gray-500', bg: 'bg-gray-100', bar: 'bg-gray-400' },
    { label: 'Unique FLS', value: uniqueFls, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
    { label: 'Total Pages', value: totalPages, icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50', bar: 'bg-violet-500' },
  ];

  return (
    <FlsLayout title="FLS Booking" subtitle="Manage FLS booking details">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-brand-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow shadow-sm">
            <div className={`h-1 ${s.bar}`} />
            <div className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-[10px] text-brand-500 uppercase tracking-widest font-semibold">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color} leading-tight mt-0.5`}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <FlsFilter
        search={search} onSearchChange={v => { setSearch(v); resetPage(); }}
        unitNo={unitNo} onUnitNoChange={v => { setUnitNo(v); resetPage(); }}
        flsAgent={flsAgent} onFlsAgentChange={v => { setFlsAgent(v); resetPage(); }}
        customerName={customerName} onCustomerNameChange={v => { setCustomerName(v); resetPage(); }}
        dateFrom={dateFrom} onDateFromChange={v => { setDateFrom(v); resetPage(); }}
        dateTo={dateTo} onDateToChange={v => { setDateTo(v); resetPage(); }}
        onExport={handleExport} exporting={exporting}
        onAddNew={() => router.push('/fls-booking-portal/booking/add')}
        theme="blue"
      />

      <div className="bg-white rounded-xl border border-brand-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-800 border-b border-brand-700">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-brand-200 uppercase tracking-widest w-10">#</th>
                {TABLE_COLUMNS.map(col => (
                  <th key={col.key} className="text-left px-4 py-3 text-[10px] font-bold text-brand-200 uppercase tracking-widest whitespace-nowrap">{col.label}</th>
                ))}
                <th className="text-left px-4 py-3 text-[10px] font-bold text-brand-200 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {loading ? (
                <tr><td colSpan={TABLE_COLUMNS.length + 2} className="py-20 text-center">
                  <div className="flex items-center justify-center gap-2.5 text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-sm">Loading records...</span>
                  </div>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={TABLE_COLUMNS.length + 2} className="py-20 text-center">
                  <p className="text-gray-400 text-sm">No records found</p>
                  <p className="text-gray-300 text-xs mt-1">Try adjusting your filters</p>
                </td></tr>
              ) : data.map((row, idx) => (
                <tr key={row.id} className="hover:bg-brand-50 transition-colors group">
                  <td className="px-4 py-3.5 text-brand-400 tabular-nums text-xs font-mono">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  {TABLE_COLUMNS.map(col => (
                    <td key={col.key} className="px-4 py-3.5 text-brand-800 whitespace-nowrap text-sm">
                      {col.isDate
                        ? <span className="text-gray-500 text-xs font-mono">{formatDate(row[col.key])}</span>
                        : (row[col.key] ?? <span className="text-gray-300">—</span>)}
                    </td>
                  ))}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => router.push(`/fls-booking-portal/booking/${row.id}/edit`)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => router.push(`/fls-booking-portal/booking/${row.id}/logs`)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="View Logs">
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(row)} disabled={deleting === row.id}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-brand-100 bg-brand-50 flex items-center justify-between">
          <span className="text-xs text-brand-500">
            Showing <span className="text-gray-700 font-medium">{data.length}</span> of{' '}
            <span className="text-gray-700 font-medium">{total}</span> records
          </span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-brand-200 hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-xs text-brand-500 px-2">
              <span className="text-gray-800 font-semibold">{page}</span>
              <span className="text-gray-300 mx-1">/</span>
              <span className="text-gray-500">{totalPages}</span>
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-brand-200 hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </FlsLayout>
  );
}
