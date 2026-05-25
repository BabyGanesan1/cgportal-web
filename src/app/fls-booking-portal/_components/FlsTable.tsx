'use client';
import React from 'react';
import { Pencil, Trash2, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 20;

type TableCol = { key: string; label: string; minW: number; isDate?: boolean };

// All columns from Login Counter Excel template — exact header names (shared across all three pages)
export const FLS_TABLE_COLUMNS: TableCol[] = [
  { key: 'project', label: 'Project', minW: 120 },
  { key: 'region', label: 'REGION', minW: 90 },
  { key: 'stock', label: 'STOCK', minW: 80 },
  { key: 'pl_team', label: 'P & L Team', minW: 100 },
  { key: 'type', label: 'TYPE', minW: 80 },
  { key: 'con', label: 'CON', minW: 70 },
  { key: 'unit_no', label: 'Unit No', minW: 90 },
  { key: 'swap_from_unit_details', label: 'Swap from unit details', minW: 160 },
  { key: 'name', label: 'Name', minW: 150 },
  { key: 'booking_form_date', label: 'Booking Form Date', minW: 130, isDate: true },
  { key: 'login_counter_date', label: 'Login counter Date', minW: 130, isDate: true },
  { key: 'values_amount', label: 'Values', minW: 90 },
  { key: 'rs_in_crs', label: 'Rs in Crs', minW: 90 },
  { key: 'net_sales', label: 'Net Sales', minW: 100 },
  { key: 'gross_sales', label: 'Gross Sales', minW: 100 },
  { key: 'booking_form_status', label: 'BOOKING FORM STATUS', minW: 160 },
  { key: 'form_type', label: 'Form Type', minW: 100 },
  { key: 'bf_received_date', label: 'BF Received Date', minW: 130, isDate: true },
  { key: 'booking_form_received_by_whom', label: 'Booking form received by whom', minW: 200 },
  { key: 'hold_date', label: 'HOLD DATE', minW: 110, isDate: true },
  { key: 'file_transfer_details', label: 'File transfer details', minW: 160 },
  { key: 'file_transfer_date', label: 'File Transfer Date', minW: 140, isDate: true },
  { key: 'remarks', label: 'Remarks', minW: 180 },
  { key: 'lbc_date', label: 'LBC Date', minW: 110, isDate: true },
  { key: 'fls_id', label: 'FLS ID', minW: 80 },
  { key: 'fls_name', label: 'FLS Name', minW: 120 },
  { key: 'mgr_id', label: 'Mgr_Id', minW: 80 },
  { key: 'mgr_name', label: 'Mgr Name', minW: 120 },
  { key: 'avp_id', label: 'AVP_Id', minW: 80 },
  { key: 'avp_name', label: 'AVP Name', minW: 120 },
  { key: 'scheme', label: 'Scheme', minW: 110 },
  { key: 'acknowledgement', label: 'Acknowledgement', minW: 150 },
  { key: 'acknowledgement_remarks', label: 'Acknowledgement Remarks', minW: 190 },
  { key: 'pdc_status', label: 'PDC Status', minW: 100 },
  { key: 'pdc_cheque_received', label: 'PDC Cheque Received', minW: 150 },
  { key: 'pdc_amount', label: 'PDC Amount', minW: 100 },
  { key: 'pdc_date', label: 'PDC date', minW: 100, isDate: true },
  { key: 'pdc_cheque_no', label: 'PDC CHEQUE NO', minW: 130 },
  { key: 'bank_name_pdc', label: 'BANK NAME', minW: 120 },
  { key: 'payment_mode', label: 'Payment Mode', minW: 120 },
  { key: 'payment_confirmation_with_confirmed_date', label: 'Payment Confirmation with confirmed date', minW: 230 },
  { key: 'booking_amount', label: 'Booking amount', minW: 130 },
  { key: 'cheque_date', label: 'Cheque Date', minW: 110, isDate: true },
  { key: 'cheque_no', label: 'Cheque NO', minW: 100 },
  { key: 'bank_name', label: 'Bank name', minW: 120 },
  { key: 'sent_for_cit_verification_date', label: 'Sent for CIT verification (date)', minW: 200, isDate: true },
  { key: 'sf_record_id', label: 'SF Record ID', minW: 110 },
  { key: 'status_of_cit_verification', label: 'Status of CIT Verification', minW: 180 },
  { key: 'verified_by_whom', label: 'VERIFIED BY WHOM', minW: 150 },
  { key: 'verified_date', label: 'Verfied Date', minW: 110, isDate: true },
  { key: 'phone_number_1', label: 'PHONE NUMBER 1', minW: 130 },
  { key: 'phone_number_2', label: 'PHONE NUMBER 2', minW: 130 },
  { key: 'phone_number_3', label: 'PHONE NUMBER 3', minW: 130 },
  { key: 'phone_number_4', label: 'PHONE NUMBER 4', minW: 130 },
  { key: 'mail_id_1', label: 'MAIL ID 1', minW: 150 },
  { key: 'mail_id_2', label: 'MAIL ID 2', minW: 150 },
  { key: 'mail_id_3', label: 'MAIL ID 3', minW: 150 },
  { key: 'mail_id_4', label: 'MAIL ID 4', minW: 150 },
  { key: 'source_taken_lead', label: 'Source Taken Lead', minW: 130 },
  { key: 'pushed_date', label: 'Pushed Date', minW: 110, isDate: true },
  { key: 'source', label: 'Source', minW: 100 },
  { key: 'sub_source', label: 'Sub Source', minW: 110 },
  { key: 'iden_date', label: 'Iden Date', minW: 100, isDate: true },
  { key: 'source_remarks', label: 'Source Remarks', minW: 160 },
  { key: 'customer_type', label: 'Customer Type', minW: 120 },
  { key: 'name', label: 'Customer Name', minW: 180 },
  { key: 'sf_lead_id1', label: 'SF Lead id1', minW: 110 },
  { key: 'sf_lead2', label: 'SF Lead2', minW: 100 },
  { key: 'sf_lead3', label: 'SF Lead3', minW: 100 },
  { key: 'sell_do_lead1', label: 'Sell Do Lead1', minW: 120 },
  { key: 'sell_do_lead2', label: 'Sell Do Lead2', minW: 120 },
  { key: 'sell_do_lead3', label: 'Sell Do Lead3', minW: 120 },
  { key: 'sf_lead1_clone', label: 'SF Lead1 Clone', minW: 120 },
  { key: 'sf_lead2_clone', label: 'SF Lead2 Clone', minW: 120 },
  { key: 'sf_lead3_clone', label: 'SF Lead3 clone', minW: 120 },
  { key: 'sf_lead_id1_owner', label: 'SF Lead id1 Owner', minW: 140 },
  { key: 'pushed_date_lead1', label: 'Pushed Date', minW: 110, isDate: true },
  { key: 'sf_lead1_walkin_date', label: 'SF Lead1 Walkin Date', minW: 150, isDate: true },
  { key: 'walkin_project_lead1', label: 'Walkin Project', minW: 130 },
  { key: 'sf_lead_id2_owner', label: 'SF Lead id2 Owner', minW: 140 },
  { key: 'pushed_date_lead2', label: 'Pushed Date', minW: 110, isDate: true },
  { key: 'sf_lead2_walkin_date', label: 'SF Lead2 Walkin Date', minW: 150, isDate: true },
  { key: 'walkin_project_lead2', label: 'Walkin Project', minW: 130 },
  { key: 'sf_lead_id3_owner', label: 'SF Lead id3 Owner', minW: 140 },
  { key: 'pushed_date_lead3', label: 'Pushed Date', minW: 110, isDate: true },
  { key: 'sf_lead3_walkin_date', label: 'SF Lead3 Walkin Date', minW: 150, isDate: true },
  { key: 'walkin_project_lead3', label: 'Walkin Project', minW: 130 },
  { key: 'lead_remarks', label: 'Lead Remarks', minW: 160 },
  { key: 'walk_in_date', label: 'Walk In Date', minW: 110, isDate: true },
  { key: 'login_before_cancel_remarks', label: 'Login before Cancel to Relogin remarks', minW: 220 },
  { key: 'msp', label: 'MSP', minW: 80 },
  { key: 'msp_amount', label: 'MSP Amount', minW: 120 },
  { key: 'taken_price', label: 'Taken Price', minW: 110 },
  { key: 'discount', label: 'Discount', minW: 100 },
  { key: 'msp_land_cost', label: 'MSP Land Cost', minW: 130 },
  { key: 'msp_construction_cost', label: 'MSP Construction Cost', minW: 180 },
  { key: 'taken_land_cost', label: 'Taken Land Cost', minW: 130 },
  { key: 'taken_construction_cost', label: 'Taken Construction Cost', minW: 190 },
  { key: 'msp_apartment_cost', label: 'MSP Apartment Cost', minW: 160 },
  { key: 'taken_apartment_cost', label: 'Taken Apartment Cost', minW: 170 },
  { key: 'msp_custom_amount', label: 'MSP Custom Amount', minW: 160 },
  { key: 'offer', label: 'Offer', minW: 110 },
  { key: 'offer_description', label: 'Offer Description', minW: 160 },
  { key: 'upfront_details', label: 'Upfront Details', minW: 160 },
  { key: 'description', label: 'Description', minW: 160 },
];

function formatDate(val: string) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-GB');
}

function StatusBadge({ value }: { value: string }) {
  if (!value) return <span className="text-gray-400 text-xs">—</span>;
  const colors: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border border-red-200',
    pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  };
  const cls = colors[value.toLowerCase()] ?? 'bg-blue-100 text-blue-700 border border-blue-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize tracking-wide ${cls}`}>
      {value}
    </span>
  );
}

function VerifyBadge({ value, remarks }: { value: string; remarks?: string }) {
  if (!value) return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-gray-100 text-gray-500 border border-gray-200">
      Yet to Verify
    </span>
  );
  const cls = value === 'verified'
    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    : value === 'canceled'
      ? 'bg-red-100 text-red-700 border border-red-200'
      : 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  const showRemarks = value !== 'verified' && remarks;
  return (
    <div className="relative group/vbadge inline-block">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize tracking-wide ${cls}`}>
        {value}
      </span>
      {showRemarks && (
        <>
          <p className="text-[10px] text-gray-400 mt-0.5 max-w-[150px] truncate">{remarks}</p>
          <div className="absolute bottom-full left-0 mb-1 z-50 hidden group-hover/vbadge:block pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded px-2 py-1.5 max-w-[220px] whitespace-normal shadow-lg leading-relaxed">
              {remarks}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type PageType = 'booking' | 'checking' | 'source';

interface Props {
  type: PageType;
  data: any[];
  loading: boolean;
  page: number;
  total: number;
  totalPages: number;
  isDark: boolean;
  deleting: number | null;
  onDelete: (row: any) => void;
  onPageChange: (p: number) => void;
  globalSearch?: string;
}

const SPINNER_COLOR: Record<PageType, string> = {
  booking: 'border-t-blue-500',
  checking: 'border-t-emerald-500',
  source: 'border-t-purple-500',
};

const EDIT_HOVER: Record<PageType, string> = {
  booking: 'hover:text-blue-600 hover:bg-blue-50',
  checking: 'hover:text-emerald-600 hover:bg-emerald-50',
  source: 'hover:text-purple-600 hover:bg-purple-50',
};

const COL_SPAN = FLS_TABLE_COLUMNS.length + 5; // # + columns + 3 status + action

export default function FlsTable({
  type, data, loading, page, total, totalPages, isDark, deleting, onDelete, onPageChange, globalSearch,
}: Props) {
  const router = useRouter();
  const stickyBg = isDark ? '#162c44' : '#ffffff';

  const displayData = globalSearch?.trim()
    ? data.filter(row => {
      const q = globalSearch.toLowerCase();
      // For verify status: null/empty is displayed as "Yet to Verify"
      const verifyDisplay = row.checking_verify_status
        ? String(row.checking_verify_status).toLowerCase()
        : 'yet to verify';
      const bookingStatus = row.booking_form_status
        ? String(row.booking_form_status).toLowerCase()
        : '';
      return (
        FLS_TABLE_COLUMNS.some(col => {
          const v = row[col.key];
          return v != null && String(v).toLowerCase().includes(q);
        }) ||
        verifyDisplay.includes(q) ||
        bookingStatus.includes(q)
      );
    })
    : data;

  return (
    <div className="bg-white rounded-xl border border-brand-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 transparent' }}>
        <table className="text-sm border-collapse" style={{ minWidth: '10000px', width: '100%' }}>
          <thead>
            <tr className="bg-brand-800 border-b border-brand-700">
              <th className="text-left px-3 py-3 text-[10px] font-bold text-brand-200 uppercase tracking-widest whitespace-nowrap w-10">#</th>
              {FLS_TABLE_COLUMNS.map(col => (
                <th key={col.key} style={{ minWidth: col.minW }}
                  className="text-left px-3 py-3 text-[10px] font-bold text-brand-200 uppercase tracking-widest whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {/* <th className="text-left px-3 py-3 text-[10px] font-bold text-brand-200 uppercase tracking-widest whitespace-nowrap" style={{ minWidth: 140 }}>
                Booking Status
              </th> */}
              <th className="fls-sticky bg-brand-800 text-left px-3 py-3 text-[10px] font-bold text-brand-200 uppercase tracking-widest whitespace-nowrap"
                style={{ position: 'sticky', right: 100, minWidth: 150, zIndex: 2, borderLeft: '1px solid #1e3a5c' }}>
                Verify Status
              </th>

              <th className="fls-sticky bg-brand-800 text-left px-3 py-3 text-[10px] font-bold text-brand-200 uppercase tracking-widest whitespace-nowrap"
                style={{ position: 'sticky', right: 0, width: 100, zIndex: 2, borderLeft: '1px solid #1e3a5c' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {loading ? (
              <tr><td colSpan={COL_SPAN} className="py-20 text-center">
                <div className="flex items-center justify-center gap-2.5 text-gray-400">
                  <div className={`w-4 h-4 border-2 border-gray-200 ${SPINNER_COLOR[type]} rounded-full animate-spin`} />
                  <span className="text-sm">Loading records...</span>
                </div>
              </td></tr>
            ) : displayData.length === 0 ? (
              <tr><td colSpan={COL_SPAN} className="py-20 text-center">
                <p className="text-gray-400 text-sm">No records found</p>
                <p className="text-gray-300 text-xs mt-1">Try adjusting your filters</p>
              </td></tr>
            ) : displayData.map((row, idx) => (
              <tr key={row.id} className="hover:bg-brand-50 transition-colors group">
                <td className="px-3 py-3 text-brand-400 tabular-nums text-xs font-mono">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                {FLS_TABLE_COLUMNS.map(col => (
                  <td key={col.key} className="px-3 py-3 text-brand-800 whitespace-nowrap text-sm">
                    {col.isDate
                      ? <span className="text-gray-500 text-xs font-mono">{formatDate(row[col.key])}</span>
                      : (row[col.key] ?? <span className="text-gray-300">—</span>)}
                  </td>
                ))}
                {/* <td className="px-3 py-3 whitespace-nowrap">
                  <StatusBadge value={row.booking_form_status} />
                </td> */}
                <td className="fls-sticky px-3 py-3 whitespace-nowrap"
                  style={{ position: 'sticky', right: 100, background: stickyBg, zIndex: 1, borderLeft: '1px solid #e2e8f0' }}>
                  <VerifyBadge value={row.checking_verify_status} remarks={row.remarks} />
                </td>

                <td className="fls-sticky px-3 py-3"
                  style={{ position: 'sticky', right: 0, background: stickyBg, zIndex: 1, borderLeft: '1px solid #e2e8f0' }}>
                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => router.push(`/fls-booking-portal/${type}/${row.id}/edit`)}
                      className={`p-1.5 rounded-md text-gray-400 ${EDIT_HOVER[type]} transition-colors`}
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => router.push(`/fls-booking-portal/${type}/${row.id}/logs`)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                      title="View Logs"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(row)}
                      disabled={deleting === row.id}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-3 border-t border-brand-100 bg-brand-50 flex items-center justify-between">
        <span className="text-xs text-brand-500">
          Showing <span className="text-gray-700 font-medium">{data.length}</span> of{' '}
          <span className="text-gray-700 font-medium">{total}</span> records
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-brand-200 hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-xs text-brand-500 px-2">
            <span className="text-gray-800 font-semibold">{page}</span>
            <span className="text-gray-300 mx-1">/</span>
            <span className="text-gray-500">{totalPages}</span>
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-brand-200 hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}