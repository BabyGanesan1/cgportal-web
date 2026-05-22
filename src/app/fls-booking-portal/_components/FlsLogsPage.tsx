'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, User, ChevronLeft, ChevronRight, Search, X, RefreshCw, Filter, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FlsLayout from './FlsLayout';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const PAGE_SIZE = 50;
const MODULES = ['', 'BOOKING', 'CHECKING', 'SOURCE'];
const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE'];
const EMPTY_FILTERS = { search: '', field_name: '', user_name: '', module: '', action: '', date_from: '', date_to: '' };

type PageType = 'booking' | 'checking' | 'source';

interface FlsLog {
  id: number;
  booking_id: number;
  module: 'BOOKING' | 'CHECKING' | 'SOURCE' | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  user_id: number | null;
  user_email: string;
  user_name: string | null;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  createdAt: string;
}

function ModuleBadge({ module: mod }: { module: string | null }) {
  if (!mod) return null;
  const map: Record<string, string> = {
    BOOKING: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    CHECKING: 'bg-amber-100 text-amber-700 border border-amber-200',
    SOURCE: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${map[mod] || 'bg-gray-100 text-gray-600'}`}>{mod}</span>;
}

const FIELD_LABELS: Record<string, string> = {
  project: 'Project', region: 'Region', stock: 'Stock', pl_team: 'PL Team',
  type: 'Type', con: 'Con', unit_no: 'Unit No', swap_from_unit_details: 'Swap From Unit Details',
  name: 'Customer Name', booking_form_date: 'Booking Form Date',
  login_counter_date: 'Login Counter Date', values_amount: 'Values / Amount',
  rs_in_crs: 'Rs In Crs', net_sales: 'Net Sales', gross_sales: 'Gross Sales',
  booking_form_status: 'Booking Form Status', form_type: 'Form Type',
  bf_received_date: 'BF Received Date', booking_form_received_by_whom: 'BF Received By Whom',
  hold_date: 'Hold Date', file_transfer_details: 'File Transfer Details',
  file_transfer_date: 'File Transfer Date', lbc_date: 'LBC Date',
  fls_id: 'FLS ID', fls_name: 'FLS Name', mgr_id: 'MGR ID', mgr_name: 'MGR Name',
  avp_id: 'AVP ID', avp_name: 'AVP Name', scheme: 'Scheme',
  acknowledgement: 'Acknowledgement', acknowledgement_remarks: 'Acknowledgement Remarks',
  pdc_status: 'PDC Status', pdc_cheque_received: 'PDC Cheque Received',
  pdc_amount: 'PDC Amount', pdc_date: 'PDC Date', pdc_cheque_no: 'PDC Cheque No',
  bank_name_pdc: 'Bank Name (PDC)', payment_mode: 'Payment Mode',
  payment_confirmation_with_confirmed_date: 'Payment Confirmation Date',
  booking_amount: 'Booking Amount', cheque_date: 'Cheque Date', cheque_no: 'Cheque No',
  bank_name: 'Bank Name', sent_for_cit_verification_date: 'Sent For CIT Verification Date',
  sf_record_id: 'SF Record ID', status_of_cit_verification: 'Status Of CIT Verification',
  verified_by_whom: 'Verified By Whom', verified_date: 'Verified Date',
  phone_number_1: 'Phone 1', phone_number_2: 'Phone 2',
  phone_number_3: 'Phone 3', phone_number_4: 'Phone 4',
  mail_id_1: 'Mail ID 1', mail_id_2: 'Mail ID 2', mail_id_3: 'Mail ID 3', mail_id_4: 'Mail ID 4',
  remarks: 'Remarks', login_before_cancel_remarks: 'Login Before Cancel Remarks',
  description: 'Description', attachments: 'Attachments',
  checking_verify_status: 'Checking Verify Status', msp: 'MSP',
  taken_price: 'Taken Price', discount: 'Discount', land_cost: 'Land Cost',
  construction_cost: 'Construction Cost', msp_custom_amount: 'MSP Custom Amount',
  offer: 'Offer', offer_description: 'Offer Description', upfront_details: 'Upfront Details',
  source_verify_status: 'Source Verify Status', customer_type: 'Customer Type',
  source_customer_name: 'Customer Name (Source)', source_taken_lead: 'Source Taken Lead',
  pushed_date: 'Pushed Date', source: 'Source', sub_source: 'Sub Source',
  iden_date: 'Iden Date', source_remarks: 'Source Remarks',
  sf_lead_id1: 'SF Lead ID 1', sf_lead2: 'SF Lead 2', sf_lead3: 'SF Lead 3',
  sell_do_lead1: 'Sell Do Lead 1', sell_do_lead2: 'Sell Do Lead 2', sell_do_lead3: 'Sell Do Lead 3',
  sf_lead1_clone: 'SF Lead 1 Clone', sf_lead2_clone: 'SF Lead 2 Clone', sf_lead3_clone: 'SF Lead 3 Clone',
  sf_lead_id1_owner: 'SF Lead ID 1 Owner', pushed_date_lead1: 'Pushed Date Lead 1',
  sf_lead1_walkin_date: 'SF Lead 1 Walk-In Date', walkin_project_lead1: 'Walk-In Project Lead 1',
  sf_lead_id2_owner: 'SF Lead ID 2 Owner', pushed_date_lead2: 'Pushed Date Lead 2',
  sf_lead2_walkin_date: 'SF Lead 2 Walk-In Date', walkin_project_lead2: 'Walk-In Project Lead 2',
  sf_lead_id3_owner: 'SF Lead ID 3 Owner', pushed_date_lead3: 'Pushed Date Lead 3',
  sf_lead3_walkin_date: 'SF Lead 3 Walk-In Date', walkin_project_lead3: 'Walk-In Project Lead 3',
  lead_remarks: 'Lead Remarks', walk_in_date: 'Walk-In Date',
};

function getLabel(field: string | null): string {
  if (!field) return '';
  return FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(val: string): string {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return val; }
}

function getUserInitials(email: string, name?: string | null): string {
  if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (email || '?').slice(0, 2).toUpperCase();
}

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, string> = {
    CREATE: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    UPDATE: 'bg-blue-100 text-blue-700 border border-blue-200',
    DELETE: 'bg-red-100 text-red-700 border border-red-200',
  };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${map[action] || 'bg-gray-100 text-gray-600'}`}>{action}</span>;
}

interface LogGroup {
  user_email: string; user_name: string | null;
  action: string; module: string | null;
  createdAt: string; entries: FlsLog[];
}

function groupLogs(logs: FlsLog[]): LogGroup[] {
  const groups: LogGroup[] = [];
  for (const log of logs) {
    const minute = log.createdAt?.slice(0, 16);
    const last = groups[groups.length - 1];
    if (last && last.user_email === log.user_email && last.action === log.action && last.createdAt?.slice(0, 16) === minute) {
      last.entries.push(log);
    } else {
      groups.push({ user_email: log.user_email, user_name: log.user_name, action: log.action, module: log.module || null, createdAt: log.createdAt, entries: [log] });
    }
  }
  return groups;
}

const TYPE_LABEL: Record<PageType, string> = { booking: 'Booking', checking: 'Checking', source: 'Source' };

interface Props { type: PageType; id: string; }

export default function FlsLogsPage({ type, id }: Props) {
  const router = useRouter();
  const label = TYPE_LABEL[type];

  // Checking verify status summary (fetched from booking record)
  const [verifyStatus, setVerifyStatus] = useState<{ status: string | null; remarks: string | null } | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(true);

  const [logs, setLogs] = useState<FlsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [pending, setPending] = useState({ ...EMPTY_FILTERS });

  // Fetch the booking record once to get checking_verify_status and remarks
  useEffect(() => {
    setVerifyLoading(true);
    api.get(`/fls-booking/${id}`)
      .then(res => {
        const d = res.data?.data || res.data;
        setVerifyStatus({
          status: d?.checking_verify_status ?? null,
          remarks: d?.remarks ?? null,
        });
      })
      .catch(() => setVerifyStatus(null))
      .finally(() => setVerifyLoading(false));
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qp: Record<string, any> = { page, limit: PAGE_SIZE };
    if (filters.search) qp.search = filters.search;
    if (filters.field_name) qp.field_name = filters.field_name;
    if (filters.user_name) qp.user_name = filters.user_name;
    if (filters.module) qp.module = filters.module;
    if (filters.action) qp.action = filters.action;
    if (filters.date_from) qp.date_from = filters.date_from;
    if (filters.date_to) qp.date_to = filters.date_to;

    api.get(`/fls-booking/${id}/logs`, { params: qp })
      .then(res => {
        if (cancelled) return;
        setLogs(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      })
      .catch(() => { if (!cancelled) toast.error('Failed to load logs'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id, page, filters]);

  const handleApply = () => { setFilters({ ...pending }); setPage(1); };
  const handleReset = () => { setPending({ ...EMPTY_FILTERS }); setFilters({ ...EMPTY_FILTERS }); setPage(1); };
  const set = (k: keyof typeof pending) => (v: string) => setPending(p => ({ ...p, [k]: v }));
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const groups = groupLogs(logs);

  return (
    <FlsLayout title="Change Logs" subtitle={`Activity history for ${label} #${id}`}>
      <div className="mb-5">
        <button
          onClick={() => router.push(`/fls-booking-portal/${type}`)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {label} List
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{label} #{id} — Change History</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {total} log {total === 1 ? 'entry' : 'entries'}
            {activeFilterCount > 0 && (
              <span className="ml-1 text-blue-500">· {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>
            )}
          </p>
        </div>
        <Clock className="w-6 h-6 text-slate-400" />
      </div>

      {/* Checking Verify Status Panel */}
      {!verifyLoading && verifyStatus && (() => {
        const st = (verifyStatus.status || '').toLowerCase();
        const isVerified = st === 'verified';
        const isHold = st === 'hold';
        const isCancel = st === 'canceled' || st === 'cancelled' || st === 'cancel';
        const isNone = !st;

        const cfg = isVerified
          ? { bg: 'bg-emerald-50 border-emerald-200', icon: ShieldCheck, iconCls: 'text-emerald-600', label: 'Verified', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
          : isHold
            ? { bg: 'bg-amber-50 border-amber-200', icon: ShieldAlert, iconCls: 'text-amber-500', label: 'Hold', badge: 'bg-amber-100 text-amber-700 border-amber-200' }
            : isCancel
              ? { bg: 'bg-red-50 border-red-200', icon: ShieldX, iconCls: 'text-red-500', label: verifyStatus.status, badge: 'bg-red-100 text-red-700 border-red-200' }
              : { bg: 'bg-slate-50 border-slate-200', icon: ShieldCheck, iconCls: 'text-slate-400', label: 'Yet to Verify', badge: 'bg-slate-100 text-slate-500 border-slate-200' };

        const Icon = cfg.icon;
        return (
          <div className={`border rounded-xl shadow-sm p-4 mb-4 flex items-start gap-4 ${cfg.bg}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isVerified ? 'bg-emerald-100' : isHold ? 'bg-amber-100' : isCancel ? 'bg-red-100' : 'bg-slate-100'}`}>
              <Icon className={`w-5 h-5 ${cfg.iconCls}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-800">Checking Verify Status</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${cfg.badge}`}>
                  {cfg.label || 'Yet to Verify'}
                </span>
              </div>
              {(isHold || isCancel) && verifyStatus.remarks && (
                <div className="mt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Remarks</span>
                  <p className={`mt-0.5 text-sm rounded-lg px-3 py-2 border ${isHold ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                    {verifyStatus.remarks}
                  </p>
                </div>
              )}
              {isVerified && (
                <p className="text-xs text-emerald-600 mt-1">This booking has been verified. No remarks required.</p>
              )}
              {isNone && (
                <p className="text-xs text-slate-400 mt-1">Verification has not been completed yet.</p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Filter panel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-3 lg:col-span-4">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                className="pl-8 pr-8 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-sm"
                placeholder="Search user, old/new value…"
                value={pending.search}
                onChange={e => set('search')(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleApply()}
              />
              {pending.search && (
                <button onClick={() => set('search')('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Field Name</label>
            <input className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-sm"
              placeholder="e.g. cheque_no" value={pending.field_name}
              onChange={e => set('field_name')(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleApply()} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">User Name</label>
            <input className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-sm"
              placeholder="e.g. John" value={pending.user_name}
              onChange={e => set('user_name')(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleApply()} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Module / Page</label>
            <select className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-sm"
              value={pending.module} onChange={e => set('module')(e.target.value)}>
              {MODULES.map(m => <option key={m} value={m}>{m || 'All Modules'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Action Type</label>
            <select className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-sm"
              value={pending.action} onChange={e => set('action')(e.target.value)}>
              {ACTIONS.map(a => <option key={a} value={a}>{a || 'All Actions'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Date From</label>
            <input type="date" className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-sm"
              value={pending.date_from} onChange={e => set('date_from')(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Date To</label>
            <input type="date" className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-sm"
              value={pending.date_to} onChange={e => set('date_to')(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <button onClick={handleApply}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Filter className="w-3.5 h-3.5" /> Apply Filters
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <span className="ml-auto text-xs text-slate-400">
            {loading ? 'Loading…' : `${total} ${total === 1 ? 'entry' : 'entries'} found`}
          </span>
        </div>
      </div>

      {/* Log groups */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          Loading logs...
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No log entries found</p>
          <p className="text-xs mt-1 opacity-60">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, gi) => (
            <div key={gi} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
                <div className="w-9 h-9 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {getUserInitials(group.user_email, group.user_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{group.user_name || group.user_email}</span>
                    {group.action === 'CREATE' && <span className="text-sm text-slate-600">created the record</span>}
                    {group.action === 'DELETE' && <span className="text-sm text-slate-600">deleted the record</span>}
                    {group.action === 'UPDATE' && (
                      <span className="text-sm text-slate-600">
                        updated {group.entries.filter(e => e.field_name).length} field{group.entries.filter(e => e.field_name).length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <ActionBadge action={group.action} />
                    {(group.action === 'CREATE' || group.action === 'DELETE') && group.module && <ModuleBadge module={group.module} />}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(group.createdAt)}
                    {group.user_name && <><span className="mx-1">·</span><User className="w-3 h-3" />{group.user_email}</>}
                  </div>
                </div>
              </div>

              {group.action === 'UPDATE' && group.entries.some(e => e.field_name) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Module</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/4">Field</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[30%]">Old Value</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[30%]">New Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.entries.filter(e => e.field_name).map(entry => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3"><ModuleBadge module={entry.module} /></td>
                          <td className="px-5 py-3 font-medium text-slate-700">{getLabel(entry.field_name)}</td>
                          <td className="px-5 py-3">
                            {entry.old_value
                              ? <span className="inline-block bg-red-50 text-red-700 border border-red-100 rounded px-2 py-0.5 text-xs font-mono break-all">{entry.old_value}</span>
                              : <span className="text-slate-300 text-xs italic">—</span>}
                          </td>
                          <td className="px-5 py-3">
                            {entry.new_value
                              ? <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-2 py-0.5 text-xs font-mono break-all">{entry.new_value}</span>
                              : <span className="text-slate-300 text-xs italic">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(group.action === 'CREATE' || group.action === 'DELETE') && (
                <div className="px-5 py-3 text-sm text-slate-500 italic">
                  {group.action === 'CREATE' ? 'Record was created.' : 'Record was soft-deleted (marked inactive).'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm">
          <span className="text-sm text-slate-500">Page {page} of {totalPages} · {total} entries</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </FlsLayout>
  );
}