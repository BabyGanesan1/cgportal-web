'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Search, X, RefreshCw, Filter } from 'lucide-react';
import FlsLayout from '../_components/FlsLayout';
import DarkDatePicker from '../_components/DarkDatePicker';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const PAGE_SIZE = 50

const MODULES = ['', 'BOOKING', 'CHECKING', 'SOURCE'];
const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE'];

interface FlsLog {
  id: number;
  booking_id: number;
  module: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  user_id: number | null;
  user_email: string;
  user_name: string | null;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  createdAt: string;
}

const FIELD_LABELS: Record<string, string> = {
  project: 'Project', region: 'Region', stock: 'Stock', pl_team: 'PL Team',
  type: 'Type', con: 'CON', unit_no: 'Unit No', swap_from_unit_details: 'Swap From Unit Details',
  name: 'Customer Name', booking_form_date: 'Booking Form Date',
  login_counter_date: 'Login Counter Date', values_amount: 'Values / Amount',
  rs_in_crs: 'Rs In Crs', net_sales: 'Net Sales', gross_sales: 'Gross Sales',
  booking_form_status: 'Booking Form Status', form_type: 'Form Type',
  bf_received_date: 'BF Received Date', booking_form_received_by_whom: 'BF Received By Whom',
  hold_date: 'Hold Date', file_transfer_details: 'File Transfer Details',
  file_transfer_date: 'File Transfer Date', lbc_date: 'LBC Date',
  fls_id: 'FLS ID', fls_name: 'FLS Name', mgr_id: 'MGR ID', mgr_name: 'MGR Name',
  avp_id: 'AVP ID', avp_name: 'AVP Name', scheme: 'Scheme', customer_mail: 'Customer Mail',
  pdc_status: 'PDC Status', pdc_cheque_received: 'PDC Cheque Received',
  pdc_amount: 'PDC Amount', pdc_date: 'PDC Date', pdc_cheque_no: 'PDC Cheque No',
  bank_name_pdc: 'Bank Name (PDC)', payment_mode: 'Payment Mode',
  payment_confirmation_with_confirmed_date: 'Payment Confirmation Date',
  booking_amount: 'Booking Amount', cheque_date: 'Cheque Date', cheque_no: 'Cheque No',
  bank_name: 'Bank Name', sent_for_cit_verification_date: 'Sent For CIT Verification Date',
  sf_record_id: 'SF Record ID', status_of_cit_verification: 'Status Of CIT Verification',
  verified_by_whom: 'Verified By Whom', verified_date: 'Verified Date',
  phone_number_1: 'Phone 1', phone_number_2: 'Phone 2', phone_number_3: 'Phone 3', phone_number_4: 'Phone 4',
  mail_id_1: 'Mail ID 1', mail_id_2: 'Mail ID 2', mail_id_3: 'Mail ID 3', mail_id_4: 'Mail ID 4',
  remarks: 'Remarks', login_before_cancel_remarks: 'Login Before Cancel Remarks',
  checking_verify_status: 'Checking Verify Status', msp: 'MSP',
  taken_price: 'Taken Price', discount: 'Discount', upfront_details: 'Upfront Details',
  source_verify_status: 'Source Verify Status', source_taken_lead: 'Source Taken Lead',
  pushed_date: 'Pushed Date', source: 'Source', sub_source: 'Sub Source', iden_date: 'Iden Date',
  sf_lead_id1: 'SF Lead ID 1', sf_lead2: 'SF Lead 2', sf_lead3: 'SF Lead 3',
  sell_do_lead1: 'Sell Do Lead 1', sell_do_lead2: 'Sell Do Lead 2', sell_do_lead3: 'Sell Do Lead 3',
  walk_in_date: 'Walk-In Date', lead_remarks: 'Lead Remarks',
};

function getLabel(f: string | null) {
  if (!f) return '';
  return FIELD_LABELS[f] || f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(val: string) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return val; }
}

function getUserInitials(email: string, name?: string | null) {
  if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (email || '?').slice(0, 2).toUpperCase();
}

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, string> = {
    CREATE: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    UPDATE: 'bg-blue-100 text-blue-700 border border-blue-200',
    DELETE: 'bg-red-100 text-red-700 border border-red-200',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${map[action] || 'bg-gray-100 text-gray-600'}`}>
      {action}
    </span>
  );
}

function ModuleBadge({ module: mod }: { module: string | null }) {
  if (!mod) return null;
  const map: Record<string, string> = {
    BOOKING: 'bg-blue-100 text-blue-700',
    CHECKING: 'bg-emerald-100 text-emerald-700',
    SOURCE: 'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${map[mod] || 'bg-gray-100 text-gray-600'}`}>
      {mod}
    </span>
  );
}

export default function FLSHistoryLogsPage() {
  const [logs, setLogs] = useState<FlsLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state (pending = not yet applied)
  const [filters, setFilters] = useState({
    search: '', field_name: '', user_name: '',
    module: '', action: '', booking_id: '', source: '',
    date_from: '', date_to: '',
  });
  const [pending, setPending] = useState({ ...filters });

  const fetchLogs = useCallback(async (f = filters, p = page) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: PAGE_SIZE };
      if (f.search) params.search = f.search;
      if (f.field_name) params.field_name = f.field_name;
      if (f.user_name) params.user_name = f.user_name;
      if (f.module) params.module = f.module;
      if (f.action) params.action = f.action;
      if (f.booking_id) params.booking_id = f.booking_id;
      if (f.source) params.source = f.source;
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to) params.date_to = f.date_to;

      const res = await api.get('/fls-booking/logs', { params });
      setLogs(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load history logs');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchLogs(filters, page); }, [page]);

  const handleApply = () => {
    setFilters(pending);
    setPage(1);
    fetchLogs(pending, 1);
  };

  const handleReset = () => {
    const empty = { search: '', field_name: '', user_name: '', module: '', action: '', booking_id: '', source: '', date_from: '', date_to: '' };
    setPending(empty);
    setFilters(empty);
    setPage(1);
    fetchLogs(empty, 1);
  };

  const set = (k: keyof typeof pending) => (v: string) => setPending(p => ({ ...p, [k]: v }));

  return (
    <FlsLayout title="History Logs" subtitle="Complete audit trail for all FLS modules">
      {/* ── Filter panel ── */}
      <div className="bg-white rounded-xl border border-brand-100 shadow-sm p-4 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">

          {/* Search */}
          <div className="col-span-2 md:col-span-3 lg:col-span-4">
            <label className="block text-[10px] font-semibold text-brand-500 uppercase tracking-widest mb-1">Global Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400" />
              <input
                className="pl-8 pr-3 py-2 w-full bg-white border border-brand-200 rounded-lg text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 shadow-sm"
                placeholder="Search user, field name, booking ID…"
                value={pending.search}
                onChange={e => set('search')(e.target.value)}
              />
              {pending.search && (
                <button onClick={() => set('search')('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-300 hover:text-brand-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Field Name */}
          <div>
            <label className="block text-[10px] font-semibold text-brand-500 uppercase tracking-widest mb-1">Field Name</label>
            <input
              className="w-full py-2 px-3 bg-white border border-brand-200 rounded-lg text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-sm"
              placeholder="e.g. net_sales"
              value={pending.field_name}
              onChange={e => set('field_name')(e.target.value)}
            />
          </div>

          {/* User */}
          <div>
            <label className="block text-[10px] font-semibold text-brand-500 uppercase tracking-widest mb-1">User Name</label>
            <input
              className="w-full py-2 px-3 bg-white border border-brand-200 rounded-lg text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-sm"
              placeholder="e.g. John"
              value={pending.user_name}
              onChange={e => set('user_name')(e.target.value)}
            />
          </div>

          {/* Booking ID */}
          <div>
            <label className="block text-[10px] font-semibold text-brand-500 uppercase tracking-widest mb-1">Booking ID</label>
            <input
              className="w-full py-2 px-3 bg-white border border-brand-200 rounded-lg text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-sm"
              placeholder="e.g. 42"
              type="number"
              min={0}
              value={pending.booking_id}
              onChange={e => set('booking_id')(e.target.value)}
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-[10px] font-semibold text-brand-500 uppercase tracking-widest mb-1">Source</label>
            <input
              className="w-full py-2 px-3 bg-white border border-brand-200 rounded-lg text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-sm"
              placeholder="e.g. Walk-in"
              value={pending.source}
              onChange={e => set('source')(e.target.value)}
            />
          </div>

          {/* Module */}
          <div>
            <label className="block text-[10px] font-semibold text-brand-500 uppercase tracking-widest mb-1">Module / Page</label>
            <select
              className="w-full py-2 px-3 bg-white border border-brand-200 rounded-lg text-sm text-brand-800 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-sm"
              value={pending.module}
              onChange={e => set('module')(e.target.value)}
            >
              {MODULES.map(m => <option key={m} value={m}>{m || 'All Modules'}</option>)}
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="block text-[10px] font-semibold text-brand-500 uppercase tracking-widest mb-1">Action Type</label>
            <select
              className="w-full py-2 px-3 bg-white border border-brand-200 rounded-lg text-sm text-brand-800 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-sm"
              value={pending.action}
              onChange={e => set('action')(e.target.value)}
            >
              {ACTIONS.map(a => <option key={a} value={a}>{a || 'All Actions'}</option>)}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[10px] font-semibold text-brand-500 uppercase tracking-widest mb-1">Date From</label>
            <DarkDatePicker
              value={pending.date_from}
              onChange={set('date_from')}
              placeholder="From date"
              compact
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[10px] font-semibold text-brand-500 uppercase tracking-widest mb-1">Date To</label>
            <DarkDatePicker
              value={pending.date_to}
              onChange={set('date_to')}
              placeholder="To date"
              compact
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-brand-100">
          <button onClick={handleApply}
            className="flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Filter className="w-3.5 h-3.5" /> Apply Filters
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-200 rounded-lg text-sm text-brand-700 hover:bg-brand-50 transition-colors shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <span className="ml-auto text-xs text-brand-400">
            {total} log {total === 1 ? 'entry' : 'entries'} found
          </span>
        </div>
      </div>

      {/* ── Log table ── */}
      <div className="bg-white rounded-xl border border-brand-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 900 }}>
            <thead>
              <tr className="bg-brand-800 border-b border-brand-700">
                {['#', 'Module', 'Booking ID', 'Action', 'Field', 'Old Value', 'New Value', 'User', 'Date & Time'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-brand-200 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {loading ? (
                <tr><td colSpan={9} className="py-20 text-center">
                  <div className="flex items-center justify-center gap-2.5 text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-sm">Loading logs...</span>
                  </div>
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={9} className="py-20 text-center">
                  <Clock className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No log entries found</p>
                  <p className="text-gray-300 text-xs mt-1">Try adjusting your filters</p>
                </td></tr>
              ) : logs.map((log, idx) => (
                <tr key={log.id} className="hover:bg-brand-50 transition-colors">
                  <td className="px-4 py-3 text-brand-400 text-xs font-mono tabular-nums">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3"><ModuleBadge module={log.module} /></td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-brand-600">#{log.booking_id}</span>
                  </td>
                  <td className="px-4 py-3"><ActionBadge action={log.action} /></td>
                  <td className="px-4 py-3 text-brand-700 text-xs font-medium whitespace-nowrap">
                    {log.field_name ? getLabel(log.field_name) : <span className="text-gray-300 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    {log.old_value ? (
                      <span className="inline-block bg-red-50 text-red-700 border border-red-100 rounded px-2 py-0.5 text-xs font-mono break-all">
                        {log.old_value}
                      </span>
                    ) : <span className="text-gray-300 text-xs italic">—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    {log.new_value ? (
                      <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-2 py-0.5 text-xs font-mono break-all">
                        {log.new_value}
                      </span>
                    ) : <span className="text-gray-300 text-xs italic">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-800 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                        {getUserInitials(log.user_email, log.user_name)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-brand-800">{log.user_name || log.user_email}</p>
                        {log.user_name && <p className="text-[10px] text-brand-400">{log.user_email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">
                    {formatDate(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-brand-100 bg-brand-50 flex items-center justify-between">
          <span className="text-xs text-brand-500">
            Showing <span className="text-gray-700 font-medium">{logs.length}</span> of{' '}
            <span className="text-gray-700 font-medium">{total}</span> entries
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
