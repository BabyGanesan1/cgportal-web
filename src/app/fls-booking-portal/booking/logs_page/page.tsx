'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import FlsLayout from '../../../_components/FlsLayout';
import api from '../../../../../lib/api';
import toast from 'react-hot-toast';

const PAGE_SIZE = 50;

interface FlsLog {
  id: number;
  booking_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  user_id: number | null;
  user_email: string;
  user_name: string | null;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  createdAt: string;
}

// Human-readable field labels
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
  avp_id: 'AVP ID', avp_name: 'AVP Name', scheme: 'Scheme', customer_mail: 'Customer Mail',
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
  checking_verify_status: 'Checking Verify Status', msp: 'MSP',
  taken_price: 'Taken Price', discount: 'Discount', upfront_details: 'Upfront Details',
  source_verify_status: 'Source Verify Status', source_taken_lead: 'Source Taken Lead',
  pushed_date: 'Pushed Date', source: 'Source', sub_source: 'Sub Source',
  iden_date: 'Iden Date', sf_lead_id1: 'SF Lead ID 1', sf_lead2: 'SF Lead 2',
  sf_lead3: 'SF Lead 3', sell_do_lead1: 'Sell Do Lead 1', sell_do_lead2: 'Sell Do Lead 2',
  sell_do_lead3: 'Sell Do Lead 3', sf_lead1_clone: 'SF Lead 1 Clone',
  sf_lead2_clone: 'SF Lead 2 Clone', sf_lead3_clone: 'SF Lead 3 Clone',
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

// Group consecutive log entries by same user + same timestamp-minute
interface LogGroup {
  user_email: string;
  user_name: string | null;
  action: string;
  createdAt: string;
  entries: FlsLog[];
}

function groupLogs(logs: FlsLog[]): LogGroup[] {
  const groups: LogGroup[] = [];
  for (const log of logs) {
    const minute = log.createdAt?.slice(0, 16);
    const last = groups[groups.length - 1];
    if (
      last &&
      last.user_email === log.user_email &&
      last.action === log.action &&
      last.createdAt?.slice(0, 16) === minute
    ) {
      last.entries.push(log);
    } else {
      groups.push({
        user_email: log.user_email,
        user_name: log.user_name,
        action: log.action,
        createdAt: log.createdAt,
        entries: [log],
      });
    }
  }
  return groups;
}

export default function FlsBookingLogsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [logs, setLogs] = useState<FlsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/fls-booking/${id}/logs`, {
        params: { page: p, limit: PAGE_SIZE },
      });
      setLogs(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchLogs(page); }, [fetchLogs, page]);

  const groups = groupLogs(logs);

  return (
    <FlsLayout title="Change Logs" subtitle={`Activity history for Booking #${id}`}>
      {/* Back button */}
      <div className="mb-5">
        <button
          onClick={() => router.push('/fls-booking-portal/booking')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Booking List
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Booking #{id} — Change History</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {total} log {total === 1 ? 'entry' : 'entries'} total
          </p>
        </div>
        <Clock className="w-6 h-6 text-slate-400" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          Loading logs...
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          No change logs found for this record.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, gi) => (
            <div key={gi} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {getUserInitials(group.user_email, group.user_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">
                      {group.user_name || group.user_email}
                    </span>
                    {group.action === 'CREATE' && (
                      <span className="text-sm text-slate-600">created the record</span>
                    )}
                    {group.action === 'DELETE' && (
                      <span className="text-sm text-slate-600">deleted the record</span>
                    )}
                    {group.action === 'UPDATE' && (
                      <span className="text-sm text-slate-600">
                        updated {group.entries.filter(e => e.field_name).length} field
                        {group.entries.filter(e => e.field_name).length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <ActionBadge action={group.action} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(group.createdAt)}
                    {group.user_name && (
                      <>
                        <span className="mx-1">·</span>
                        <User className="w-3 h-3" />
                        {group.user_email}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Field changes table (only for UPDATE with field rows) */}
              {group.action === 'UPDATE' && group.entries.some(e => e.field_name) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/4">
                          Field
                        </th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[37.5%]">
                          Old Value
                        </th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[37.5%]">
                          New Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.entries
                        .filter(e => e.field_name)
                        .map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3 font-medium text-slate-700">
                              {getLabel(entry.field_name)}
                            </td>
                            <td className="px-5 py-3">
                              {entry.old_value ? (
                                <span className="inline-block bg-red-50 text-red-700 border border-red-100 rounded px-2 py-0.5 text-xs font-mono break-all">
                                  {entry.old_value}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs italic">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              {entry.new_value ? (
                                <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-2 py-0.5 text-xs font-mono break-all">
                                  {entry.new_value}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs italic">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CREATE / DELETE — simple message, no table */}
              {(group.action === 'CREATE' || group.action === 'DELETE') && (
                <div className="px-5 py-3 text-sm text-slate-500 italic">
                  {group.action === 'CREATE'
                    ? 'Record was created.'
                    : 'Record was soft-deleted (marked inactive).'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm">
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages} · {total} entries
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </FlsLayout>
  );
}
