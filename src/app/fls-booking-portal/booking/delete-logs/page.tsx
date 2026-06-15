'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Trash2, User, Clock, ChevronLeft, ChevronRight, Search, RefreshCw } from 'lucide-react';
import DarkDatePicker from '../../_components/DarkDatePicker';
import { useRouter } from 'next/navigation';
import FlsLayout from '../../_components/FlsLayout';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';

const PAGE_SIZE = 50;

interface FlsLog {
  id: number;
  booking_id: number;
  action: string;
  user_email: string;
  user_name: string | null;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  createdAt: string;
}

interface DeleteGroup {
  booking_id: number;
  user_email: string;
  user_name: string | null;
  createdAt: string;
  entries: FlsLog[];
}

const FIELD_LABELS: Record<string, string> = {
  project: 'Project', unit_no: 'Unit No', name: 'Customer Name',
  region: 'Region', stock: 'Stock', pl_team: 'P&L Team', type: 'Type', con: 'CON',
  fls_id: 'FLS ID', fls_name: 'FLS Name', mgr_id: 'Manager ID', mgr_name: 'Manager Name',
  avp_id: 'AVP ID', avp_name: 'AVP Name', booking_form_date: 'Booking Form Date',
  values_amount: 'Values / Amount', rs_in_crs: 'Rs in Crs',
  checking_verify_status: 'Verify Status', source: 'Source', sub_source: 'Sub Source',
};

function getLabel(field: string | null): string {
  if (!field) return '';
  return FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(val: string): string {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return val; }
}

function getUserInitials(email: string, name?: string | null): string {
  if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (email || '?').slice(0, 2).toUpperCase();
}

function groupByDelete(logs: FlsLog[]): DeleteGroup[] {
  const groups: DeleteGroup[] = [];
  for (const log of logs) {
    const minute = log.createdAt?.slice(0, 16);
    const last = groups[groups.length - 1];
    if (
      last &&
      last.booking_id === log.booking_id &&
      last.user_email === log.user_email &&
      last.createdAt?.slice(0, 16) === minute
    ) {
      last.entries.push(log);
    } else {
      groups.push({
        booking_id: log.booking_id,
        user_email: log.user_email,
        user_name: log.user_name,
        createdAt: log.createdAt,
        entries: [log],
      });
    }
  }
  return groups;
}

export default function DeleteLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<FlsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: any = { action: 'DELETE', page: p, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get('/fls-booking/logs', { params });
      setLogs(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load delete logs');
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(page); }, [fetchLogs, page]);

  const handleApply = () => { setSearch(pendingSearch); setPage(1); };
  const handleReset = () => { setPendingSearch(''); setSearch(''); setDateFrom(''); setDateTo(''); setPage(1); };

  const groups = groupByDelete(logs);

  return (
    <FlsLayout title="Deleted Records" subtitle="Audit log of all deleted FLS bookings">
      {/* Back button */}
      <div className="mb-5">
        <button
          onClick={() => router.push('/fls-booking-portal/booking')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Booking List
        </button>
      </div>

      {/* Summary header */}
      <div className="bg-white border border-red-200 rounded-xl p-5 mb-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-slate-800">Deleted Booking Records</h2>
          </div>
          <p className="text-sm text-slate-500">
            {total} deleted record{total !== 1 ? 's' : ''} found
          </p>
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
          DELETE logs only
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Search (user / project / unit)</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                className="pl-8 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="Search…"
                value={pendingSearch}
                onChange={e => setPendingSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleApply()}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Deleted From</label>
            <DarkDatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Deleted To</label>
            <DarkDatePicker value={dateTo} onChange={setDateTo} placeholder="To date" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <button onClick={handleApply}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors">
            Apply
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Log groups */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin" />
          Loading delete logs...
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Trash2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No deleted records found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, gi) => (
            <div key={gi} className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="flex items-center gap-3 px-5 py-3 bg-red-50 border-b border-red-100">
                <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {getUserInitials(group.user_email, group.user_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{group.user_name || group.user_email}</span>
                    <span className="text-sm text-slate-600">deleted</span>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Booking #{group.booking_id}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                      DELETE
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(group.createdAt)}
                    {group.user_name && (
                      <><span className="mx-1">·</span><User className="w-3 h-3" />{group.user_email}</>
                    )}
                  </div>
                </div>
              </div>

              {/* Snapshot fields */}
              {group.entries.some(e => e.field_name) ? (
                <div className="overflow-x-auto">
                  <div className="px-5 py-2 bg-red-50/60 border-b border-red-100 flex items-center gap-2">
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Deleted Record Snapshot</span>
                    <span className="text-xs text-red-400">— values at time of deletion</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/3">Field</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Value at Deletion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.entries.filter(e => e.field_name).map(entry => (
                        <tr key={entry.id} className="hover:bg-red-50/40 transition-colors">
                          <td className="px-5 py-2.5 font-medium text-slate-700">{getLabel(entry.field_name)}</td>
                          <td className="px-5 py-2.5">
                            {entry.old_value
                              ? <span className="inline-block bg-red-50 text-red-700 border border-red-100 rounded px-2 py-0.5 text-xs font-mono break-all">{entry.old_value}</span>
                              : <span className="text-slate-300 text-xs italic">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-5 py-3 text-sm text-slate-400 italic">
                  Record was deleted (no field snapshot available).
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200">
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages} · {total} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </FlsLayout>
  );
}
