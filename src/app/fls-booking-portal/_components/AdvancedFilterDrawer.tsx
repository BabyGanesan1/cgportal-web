'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X, SlidersHorizontal, Plus, Trash2, Search,
  ChevronDown, Filter, RefreshCw, ChevronUp,
} from 'lucide-react';
import api from '../../../lib/api';
import DarkDatePicker from './DarkDatePicker';
import { useFlsTheme } from './FlsThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType = 'multiselect' | 'text' | 'date';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  section: string;
  /** DB column key to fetch unique values from backend */
  valuesKey?: string;
  /** For subsource: key of the field it depends on */
  dependsOn?: string;
}

interface FilterRow {
  id: string;
  field: FieldDef;
  /** multiselect → comma-joined; text → plain string; date → from-date */
  value: string;
  /** date range: to-date */
  valueTo?: string;
}

interface Opt { label: string; value: string }

// ─── All available filter fields ─────────────────────────────────────────────
// EXCLUDED (not shown): values_amount, booking_amount, file_transfer_details,
//   source_verify_status, net_sales, gross_sales, pdc_amount,
//   payment_confirmation_with_confirmed_date (bank details raw text),
//   taken_price, discount, land_cost, construction_cost, msp_custom_amount,
//   offer, offer_description, upfront_details, rs_in_crs

const FILTER_FIELDS: FieldDef[] = [

  // ── Booking Details ──────────────────────────────────────────────────────
  { key: 'booking_form_status', label: 'Booking Status', type: 'multiselect', section: 'Booking Details', valuesKey: 'booking_form_status' },
  { key: 'payment_mode', label: 'Payment Status', type: 'multiselect', section: 'Booking Details', valuesKey: 'payment_mode' },
  { key: 'project', label: 'Project', type: 'multiselect', section: 'Booking Details', valuesKey: 'project' },
  { key: 'region', label: 'Region', type: 'multiselect', section: 'Booking Details', valuesKey: 'region' },
  { key: 'stock', label: 'Stock', type: 'multiselect', section: 'Booking Details', valuesKey: 'stock' },
  { key: 'pl_team', label: 'PL Team', type: 'multiselect', section: 'Booking Details', valuesKey: 'pl_team' },
  { key: 'type', label: 'Type', type: 'multiselect', section: 'Booking Details', valuesKey: 'type' },
  { key: 'con', label: 'CON', type: 'multiselect', section: 'Booking Details', valuesKey: 'con' },
  { key: 'form_type', label: 'Form Type', type: 'multiselect', section: 'Booking Details', valuesKey: 'form_type' },
  { key: 'scheme', label: 'Scheme', type: 'multiselect', section: 'Booking Details', valuesKey: 'scheme' },
  { key: 'acknowledgement', label: 'Acknowledge', type: 'multiselect', section: 'Booking Details', valuesKey: 'acknowledgement' },
  { key: 'booking_form_received_by_whom', label: 'BF Received By Whom', type: 'multiselect', section: 'Booking Details', valuesKey: 'booking_form_received_by_whom' },
  { key: 'booking_form_date', label: 'Booking Form Date', type: 'date', section: 'Booking Details' },
  { key: 'login_counter_date', label: 'Login Counter Date', type: 'date', section: 'Booking Details' },
  { key: 'bf_received_date', label: 'BF Received Date', type: 'date', section: 'Booking Details' },
  { key: 'hold_date', label: 'Hold Date', type: 'date', section: 'Booking Details' },
  { key: 'file_transfer_date', label: 'File Transfer Date', type: 'date', section: 'Booking Details' },
  { key: 'lbc_date', label: 'LBC Date', type: 'date', section: 'Booking Details' },
  { key: 'remarks', label: 'Remarks', type: 'text', section: 'Booking Details' },
  { key: 'login_before_cancel_remarks', label: 'Login Before Cancel Remarks', type: 'text', section: 'Booking Details' },
  { key: 'acknowledgement_remarks', label: 'Acknowledgement Remarks', type: 'text', section: 'Booking Details' },

  // ── Unit Details ─────────────────────────────────────────────────────────
  { key: 'unit_no', label: 'Unit No', type: 'multiselect', section: 'Unit Details', valuesKey: 'unit_no' },
  { key: 'swap_from_unit_details', label: 'Swap From Unit Details', type: 'text', section: 'Unit Details' },

  // ── Customer Details ─────────────────────────────────────────────────────
  { key: 'name', label: 'Customer Name', type: 'multiselect', section: 'Customer Details', valuesKey: 'name' },
  { key: 'customer_type', label: 'Customer Type', type: 'multiselect', section: 'Customer Details', valuesKey: 'customer_type' },
  // Grouped: searches phone_number_1–4
  { key: 'mobile_number', label: 'Mobile Number', type: 'text', section: 'Customer Details' },
  // Grouped: searches mail_id_1–4
  { key: 'email_filter', label: 'Email', type: 'text', section: 'Customer Details' },

  // ── Executive Details ────────────────────────────────────────────────────
  { key: 'fls_id', label: 'FLS ID', type: 'multiselect', section: 'Executive Details', valuesKey: 'fls_id' },
  { key: 'fls_name', label: 'FLS Name', type: 'multiselect', section: 'Executive Details', valuesKey: 'fls_name' },
  { key: 'mgr_id', label: 'Manager ID', type: 'multiselect', section: 'Executive Details', valuesKey: 'mgr_id' },
  { key: 'mgr_name', label: 'Manager Name', type: 'multiselect', section: 'Executive Details', valuesKey: 'mgr_name' },
  { key: 'avp_id', label: 'AVP ID', type: 'multiselect', section: 'Executive Details', valuesKey: 'avp_id' },
  { key: 'avp_name', label: 'AVP', type: 'multiselect', section: 'Executive Details', valuesKey: 'avp_name' },

  // ── Source Details ───────────────────────────────────────────────────────
  { key: 'source', label: 'Source', type: 'multiselect', section: 'Source Details', valuesKey: 'source' },
  { key: 'sub_source', label: 'Subsource', type: 'multiselect', section: 'Source Details', valuesKey: 'sub_source', dependsOn: 'source' },
  { key: 'source_customer_name', label: 'Source Customer Name', type: 'text', section: 'Source Details' },
  { key: 'source_taken_lead', label: 'Source Taken Lead', type: 'text', section: 'Source Details' },
  { key: 'source_remarks', label: 'Source Remarks', type: 'text', section: 'Source Details' },
  { key: 'pushed_date', label: 'Pushed Date', type: 'date', section: 'Source Details' },
  { key: 'iden_date', label: 'Iden Date', type: 'date', section: 'Source Details' },
  { key: 'walk_in_date', label: 'Walk In Date', type: 'date', section: 'Source Details' },

  // ── Status Details ───────────────────────────────────────────────────────
  { key: 'checking_verify_status', label: 'POC Status', type: 'multiselect', section: 'Status Details', valuesKey: 'checking_verify_status' },
  { key: 'msp', label: 'MSP', type: 'multiselect', section: 'Status Details', valuesKey: 'msp' },
  { key: 'pdc_status', label: 'PDC Status', type: 'multiselect', section: 'PDC Details', valuesKey: 'pdc_status' },

  // ── Verification Details ─────────────────────────────────────────────────
  { key: 'sf_record_id', label: 'SF Record ID', type: 'text', section: 'Verification Details' },
  { key: 'status_of_cit_verification', label: 'CIT Verification Status', type: 'multiselect', section: 'Verification Details', valuesKey: 'status_of_cit_verification' },
  { key: 'verified_by_whom', label: 'Verified By Whom', type: 'multiselect', section: 'Verification Details', valuesKey: 'verified_by_whom' },
  { key: 'verified_date', label: 'Verified Date', type: 'date', section: 'Verification Details' },
  { key: 'sent_for_cit_verification_date', label: 'CIT Sent Date', type: 'date', section: 'Verification Details' },

  // ── Date Filters ─────────────────────────────────────────────────────────
  { key: 'createdAt', label: 'Created Date', type: 'date', section: 'Date Filters' },

  // ── Lead Details ─────────────────────────────────────────────────────────
  // Grouped: searches sf_lead_id1, sf_lead2, sf_lead3
  { key: 'lead_id_filter', label: 'Lead ID', type: 'text', section: 'Lead Details' },
  // Grouped: searches sell_do_lead1, sell_do_lead2, sell_do_lead3
  { key: 'sell_do_filter', label: 'Sell DO', type: 'text', section: 'Lead Details' },
  // Grouped: searches sf_lead1_clone, sf_lead2_clone, sf_lead3_clone
  { key: 'sell_clone_filter', label: 'Sell Clone', type: 'text', section: 'Lead Details' },
  { key: 'sf_lead_id1_owner', label: 'SF Lead ID 1 Owner', type: 'text', section: 'Lead Details' },
  { key: 'pushed_date_lead1', label: 'Pushed Date Lead 1', type: 'date', section: 'Lead Details' },
  { key: 'sf_lead1_walkin_date', label: 'SF Lead 1 Walkin Date', type: 'date', section: 'Lead Details' },
  { key: 'walkin_project_lead1', label: 'Walk Project ID', type: 'text', section: 'Lead Details' },
  { key: 'sf_lead_id2_owner', label: 'SF Lead ID 2 Owner', type: 'text', section: 'Lead Details' },
  { key: 'pushed_date_lead2', label: 'Pushed Date Lead 2', type: 'date', section: 'Lead Details' },
  { key: 'sf_lead2_walkin_date', label: 'SF Lead 2 Walkin Date', type: 'date', section: 'Lead Details' },
  { key: 'walkin_project_lead2', label: 'Walkin Project Lead 2', type: 'text', section: 'Lead Details' },
  { key: 'sf_lead_id3_owner', label: 'SF Lead ID 3 Owner', type: 'text', section: 'Lead Details' },
  { key: 'pushed_date_lead3', label: 'Pushed Date Lead 3', type: 'date', section: 'Lead Details' },
  { key: 'sf_lead3_walkin_date', label: 'SF Lead 3 Walkin Date', type: 'date', section: 'Lead Details' },
  { key: 'walkin_project_lead3', label: 'Walkin Project Lead 3', type: 'text', section: 'Lead Details' },
  { key: 'lead_remarks', label: 'Lead Remarks', type: 'text', section: 'Lead Details' },

  // ── PDC Details ──────────────────────────────────────────────────────────
  { key: 'pdc_cheque_received', label: 'PDC Cheque Received', type: 'multiselect', section: 'PDC Details', valuesKey: 'pdc_cheque_received' },
  { key: 'pdc_cheque_no', label: 'PDC Check Number', type: 'text', section: 'PDC Details' },
  { key: 'bank_name_pdc', label: 'Bank Name (PDC)', type: 'multiselect', section: 'PDC Details', valuesKey: 'bank_name_pdc' },
  { key: 'pdc_date', label: 'PDC Date', type: 'date', section: 'PDC Details' },

  // ── Payment Details ──────────────────────────────────────────────────────
  { key: 'bank_name', label: 'Bank Name', type: 'multiselect', section: 'Payment Details', valuesKey: 'bank_name' },
  { key: 'cheque_no', label: 'Cheque No', type: 'text', section: 'Payment Details' },
  { key: 'cheque_date', label: 'Cheque Date', type: 'date', section: 'Payment Details' },
];

// ─── Multi-Select Searchable Dropdown ────────────────────────────────────────

interface MultiSelectProps {
  value: string[];
  onChange: (v: string[]) => void;
  options: Opt[];
  placeholder: string;
  isDark: boolean;
  disabled?: boolean;
  loading?: boolean;
}

function MultiSelectDropdown({
  value, onChange, options, placeholder, isDark, disabled = false, loading = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter(x => x !== v));
    else onChange([...value, v]);
  };

  const base = isDark
    ? 'bg-[#1e3350] border-[#2d4a68] text-[#e2e8f0]'
    : 'bg-white border-gray-200 text-gray-800';
  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
  const tagCls = isDark ? 'bg-[#2d4a68] text-[#94a3b8]' : 'bg-brand-100 text-brand-700';

  return (
    <div ref={ref} className={`relative w-full ${disabledCls}`}>
      <div
        onClick={() => { if (!disabled) { setQuery(''); setOpen(true); } }}
        className={`flex flex-wrap items-center gap-1 border rounded-lg cursor-pointer shadow-sm min-h-[38px] px-2 py-1.5 ${base}
          ${isDark ? 'focus-within:ring-[#3d6b9e] focus-within:border-[#3d6b9e]' : 'focus-within:ring-brand-500 focus-within:border-brand-500'}`}
      >
        {/* Selected tags */}
        {value.map(v => (
          <span key={v} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${tagCls}`}>
            {v}
            <button type="button" onClick={e => { e.stopPropagation(); toggle(v); }} className="hover:opacity-70">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        {/* Search input */}
        <input
          className={`flex-1 min-w-[80px] bg-transparent text-sm focus:outline-none ${isDark ? 'text-[#e2e8f0] placeholder-[#4a6580]' : 'text-gray-800 placeholder-gray-400'}`}
          placeholder={value.length === 0 ? (loading ? 'Loading...' : placeholder) : ''}
          value={open ? query : ''}
          onFocus={() => { setQuery(''); setOpen(true); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange([]); }}
            className={`shrink-0 ${isDark ? 'text-[#4d6d8a] hover:text-[#94a3b8]' : 'text-gray-300 hover:text-gray-600'}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform shrink-0 ${open ? 'rotate-180' : ''} ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`} />
      </div>

      {open && (
        <div className={`absolute top-full left-0 mt-1 z-[600] border rounded-xl shadow-xl max-h-56 overflow-y-auto w-full min-w-[220px] ${isDark ? 'bg-[#1e3350] border-[#2d4a68]' : 'bg-white border-gray-100'}`}>
          {/* Select All / Clear All */}
          {filtered.length > 0 && (
            <div className={`px-3 py-1.5 border-b flex gap-2 sticky top-0 ${isDark ? 'border-[#2d4a68] bg-[#1e3350]' : 'border-gray-100 bg-white'}`}>
              <button
                type="button"
                onClick={() => onChange(filtered.map(o => o.value))}
                className={`text-xs px-2 py-1 rounded font-medium ${isDark ? 'text-[#60a5fa] hover:bg-[#243b53]' : 'text-brand-700 hover:bg-brand-50'}`}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => onChange([])}
                className={`text-xs px-2 py-1 rounded font-medium ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-500 hover:bg-red-50'}`}
              >
                Clear
              </button>
              <span className={`ml-auto text-xs py-1 ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`}>
                {value.length > 0 ? `${value.length} selected` : ''}
              </span>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className={`px-4 py-3 text-sm text-center ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`}>
              {loading ? 'Loading...' : 'No matches'}
            </div>
          ) : filtered.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2.5 first:rounded-t-xl last:rounded-b-xl
                ${value.includes(opt.value)
                  ? (isDark ? 'text-[#e2e8f0] font-medium bg-[#243b53]' : 'text-brand-800 font-medium bg-brand-50')
                  : (isDark ? 'text-[#94a3b8] hover:bg-[#243b53]' : 'text-gray-700 hover:bg-gray-50')}`}
            >
              {/* Checkbox */}
              <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[9px] font-bold
                ${value.includes(opt.value)
                  ? (isDark ? 'bg-[#60a5fa] border-[#60a5fa] text-white' : 'bg-brand-600 border-brand-600 text-white')
                  : (isDark ? 'border-[#4d6d8a]' : 'border-gray-300')}`}
              >
                {value.includes(opt.value) && '✓'}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FilterRowInput ───────────────────────────────────────────────────────────

interface FilterRowInputProps {
  row: FilterRow;
  isDark: boolean;
  fieldValues: Record<string, Opt[] | Record<string, Opt[]>>;
  loadingKeys: Set<string>;
  allRows: FilterRow[];
  onChangeMulti: (id: string, vals: string[]) => void;
  onChangeText: (id: string, val: string) => void;
  onChangeDateTo: (id: string, val: string) => void;
}

function FilterRowInput({
  row, isDark, fieldValues, loadingKeys, allRows,
  onChangeMulti, onChangeText, onChangeDateTo,
}: FilterRowInputProps) {
  const { field } = row;

  const inputCls = isDark
    ? 'bg-[#1e3350] border-[#2d4a68] text-[#e2e8f0] placeholder-[#4a6580] focus:ring-[#3d6b9e] focus:border-[#3d6b9e]'
    : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-brand-500 focus:border-brand-500';

  if (field.type === 'date') {
    return (
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1">
          <DarkDatePicker value={row.value} onChange={v => onChangeText(row.id, v)} placeholder="From date" compact />
        </div>
        <span className={`text-xs shrink-0 ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`}>→</span>
        <div className="flex-1">
          <DarkDatePicker value={row.valueTo || ''} onChange={v => onChangeDateTo(row.id, v)} placeholder="To date" compact />
        </div>
      </div>
    );
  }

  if (field.type === 'multiselect') {
    const valuesKey = field.valuesKey || field.key;
    let opts: Opt[] = (fieldValues[valuesKey] as Opt[]) || [];
    let disabled = false;

    // Subsource depends on Source
    if (field.dependsOn) {
      const depRow = allRows.find(r => r.field.key === field.dependsOn);
      const selectedSources = depRow?.value ? depRow.value.split(',').filter(Boolean) : [];
      if (selectedSources.length === 0) {
        disabled = true;
        opts = [];
      } else {
        const sourceToSubs = (fieldValues['source_to_subsource'] || {}) as Record<string, Opt[]>;
        if (Object.keys(sourceToSubs).length > 0) {
          const allowed = new Set<string>();
          selectedSources.forEach(s => (sourceToSubs[s] || []).forEach(o => allowed.add(o.value)));
          opts = ((fieldValues[valuesKey] as Opt[]) || []).filter(o => allowed.has(o.value));
        }
      }
    }

    const selected = row.value ? row.value.split(',').filter(Boolean) : [];
    return (
      <MultiSelectDropdown
        value={selected}
        onChange={vals => onChangeMulti(row.id, vals)}
        options={opts}
        placeholder={`Select ${field.label}...`}
        isDark={isDark}
        disabled={disabled}
        loading={loadingKeys.has(valuesKey)}
      />
    );
  }

  // text
  return (
    <input
      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 shadow-sm transition-colors ${inputCls}`}
      placeholder={`Enter ${field.label.toLowerCase()}...`}
      value={row.value}
      onChange={e => onChangeText(row.id, e.target.value)}
    />
  );
}

// ─── Default filter fields shown when drawer first opens ─────────────────────
const DEFAULT_FILTER_KEYS = [
  'project',
  'booking_form_status',
  'form_type',
  'payment_mode',
  'checking_verify_status',
  'booking_form_date',
  'bf_received_date',
  'hold_date',
  'verified_date',
  'createdAt',
];

function makeDefaultRows(): FilterRow[] {
  return DEFAULT_FILTER_KEYS
    .map(key => FILTER_FIELDS.find(f => f.key === key))
    .filter((f): f is FieldDef => !!f)
    .map(field => ({ id: `${field.key}_default`, field, value: '', valueTo: '' }));
}



export interface AdvancedFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, string>) => void;
  activeFilters: Record<string, string>;
  theme?: 'blue' | 'green' | 'purple';
  storageKey?: string;
  excludeKeys?: string[];
}

export default function AdvancedFilterDrawer({
  open,
  onClose,
  onApply,
  activeFilters,
  storageKey = 'fls_adv_drawer',
  excludeKeys = [],
}: AdvancedFilterDrawerProps) {
  const { isDark } = useFlsTheme();

  // Filter rows — pre-populated with default important fields
  const [rows, setRows] = useState<FilterRow[]>(makeDefaultRows);

  // Dynamic unique values per field fetched from backend
  const [fieldValues, setFieldValues] = useState<Record<string, Opt[] | Record<string, Opt[]>>>({});
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const fetchedRef = useRef<Set<string>>(new Set());

  // Add-field panel
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [checkedFieldKeys, setCheckedFieldKeys] = useState<Set<string>>(new Set());
  const addRef = useRef<HTMLDivElement>(null);

  // Section collapse
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // ── Fetch unique values for a list of field keys
  const fetchFieldValues = useCallback(async (keys: string[]) => {
    const toFetch = keys.filter(k => !fetchedRef.current.has(k));
    if (toFetch.length === 0) return;
    toFetch.forEach(k => fetchedRef.current.add(k));

    setLoadingKeys(prev => new Set(Array.from(prev).concat(toFetch)));
    try {
      const res = await api.get('/fls-booking/filter-values', {
        params: { fields: toFetch.join(',') },
      });
      const data: Record<string, any> = res.data?.data || {};
      const mapped: Record<string, Opt[]> = {};

      for (const [k, v] of Object.entries(data)) {
        if (k === 'source_to_subsource') {
          // Stored as-is (object map), not converted to Opt[]
          setFieldValues(prev => ({ ...prev, source_to_subsource: v as any }));
        } else if (Array.isArray(v)) {
          mapped[k] = (v as string[]).filter(Boolean).map(val => ({ label: String(val), value: String(val) }));
        }
      }
      if (Object.keys(mapped).length > 0) {
        setFieldValues(prev => ({ ...prev, ...mapped }));
      }
    } catch {
      // silently fail
    } finally {
      setLoadingKeys(prev => {
        const next = new Set(Array.from(prev));
        toFetch.forEach(k => next.delete(k));
        return next;
      });
    }
  }, []);

  // Pre-fetch values when rows change
  useEffect(() => {
    const keys: string[] = [];
    let needsSubSourceMap = false;

    rows.forEach(r => {
      if (r.field.type === 'multiselect' && r.field.valuesKey) keys.push(r.field.valuesKey);
      if (r.field.key === 'sub_source') needsSubSourceMap = true;
    });

    if (needsSubSourceMap) keys.push('sub_source_map');
    if (keys.length > 0) fetchFieldValues(keys);
  }, [rows, fetchFieldValues]);

  // Restore rows from activeFilters when drawer opens
  useEffect(() => {
    if (open && Object.keys(activeFilters).length > 0) {
      // Build restored rows from active filters
      const restored: FilterRow[] = [];
      for (const [key, val] of Object.entries(activeFilters)) {
        if (key.endsWith('_to')) continue;
        const field = FILTER_FIELDS.find(f => f.key === key);
        if (!field) continue;
        restored.push({
          id: `${key}_restored`,
          field,
          value: val,
          valueTo: activeFilters[`${key}_to`] || '',
        });
      }
      if (restored.length > 0) {
        // Merge: keep default rows that aren't in restored, plus all restored rows
        setRows(prev => {
          const restoredKeys = new Set(restored.map(r => r.field.key));
          const defaults = prev.filter(r => !restoredKeys.has(r.field.key));
          return [...restored, ...defaults];
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close add-panel on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) setAddOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Escape key closes drawer
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const activeCount = rows.filter(r => r.value && r.value.length > 0).length;

  // Apply filters
  const handleApply = useCallback(() => {
    const out: Record<string, string> = {};
    rows.forEach(r => {
      if (r.value && r.value.length > 0) {
        out[r.field.key] = r.value;
        if (r.field.type === 'date' && r.valueTo) {
          out[`${r.field.key}_to`] = r.valueTo;
        }
      }
    });
    onApply(out);
    onClose();
  }, [rows, onApply, onClose]);

  // Reset all — restore default rows
  const handleReset = () => {
    setRows(makeDefaultRows());
    onApply({});
  };

  // Add a filter row
  const addRow = (field: FieldDef) => {
    if (rows.some(r => r.field.key === field.key)) return;
    setRows(prev => [...prev, { id: `${field.key}_${Date.now()}`, field, value: '', valueTo: '' }]);
    setAddOpen(false);
    setAddQuery('');
  };

  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const handleChangeMulti = (id: string, vals: string[]) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, value: vals.join(',') } : r));
    // When source changes, clear subsource
    const row = rows.find(r => r.id === id);
    if (row?.field.key === 'source') {
      setRows(prev => prev.map(r => r.field.key === 'sub_source' ? { ...r, value: '' } : r));
    }
  };

  const handleChangeText = (id: string, val: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, value: val } : r));

  const handleChangeDateTo = (id: string, val: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, valueTo: val } : r));

  // Fields available for add-panel (excluded keys only — already-added fields are shown checked)
  const usedKeys = new Set(excludeKeys as string[]);
  const availableFields = FILTER_FIELDS.filter(f => !usedKeys.has(f.key));
  const filteredAvailable = addQuery
    ? availableFields.filter(f =>
      f.label.toLowerCase().includes(addQuery.toLowerCase()) ||
      f.section.toLowerCase().includes(addQuery.toLowerCase()),
    )
    : availableFields;

  const availableBySection = filteredAvailable.reduce<Record<string, FieldDef[]>>((acc, f) => {
    if (!acc[f.section]) acc[f.section] = [];
    acc[f.section].push(f);
    return acc;
  }, {});

  const rowsBySection = rows.reduce<Record<string, FilterRow[]>>((acc, r) => {
    const s = r.field.section;
    if (!acc[s]) acc[s] = [];
    acc[s].push(r);
    return acc;
  }, {});

  // Styles
  const drawerBg = isDark ? 'bg-[#0f2236]' : 'bg-white';
  const headerBg = isDark ? 'bg-[#0a1929]' : 'bg-gray-50';
  const borderCls = isDark ? 'border-[#1e3350]' : 'border-gray-200';
  const labelCls = isDark ? 'text-[#94a3b8]' : 'text-gray-500';
  const sectionCls = isDark ? 'text-[#60a5fa]' : 'text-brand-700';
  const cardBg = isDark ? 'bg-[#1e3350] border-[#2d4a68]' : 'bg-gray-50 border-gray-200';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[500] bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-[501] w-full max-w-md flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${drawerBg} ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${headerBg} ${borderCls} flex-shrink-0`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#1e3350]' : 'bg-brand-100'}`}>
              <SlidersHorizontal className={`w-4 h-4 ${isDark ? 'text-[#60a5fa]' : 'text-brand-700'}`} />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isDark ? 'text-[#e2e8f0]' : 'text-gray-900'}`}>Advanced Filters</h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`}>
                {activeCount > 0 ? `${activeCount} filter${activeCount > 1 ? 's' : ''} active` : 'Add filters to narrow results'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? 'text-[#4d6d8a] hover:text-[#94a3b8] hover:bg-[#1e3350]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>

          {/* Add Filter button */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`}>
              Filter Fields
            </span>

            <div className="relative" ref={addRef}>
              <button
                onClick={() => { setAddOpen(v => !v); setAddQuery(''); if (!addOpen) setCheckedFieldKeys(new Set(rows.map(r => r.field.key))); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'bg-[#1e3350] border-[#3d6b9e] text-[#60a5fa] hover:bg-[#243b53]' : 'bg-white border-brand-300 text-brand-700 hover:bg-brand-50'}`}
              >
                <Plus className="w-3.5 h-3.5" /> Add Filter Field
                {checkedFieldKeys.size > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-[#60a5fa] text-[#0a1929]' : 'bg-brand-600 text-white'}`}>
                    {checkedFieldKeys.size}
                  </span>
                )}
              </button>

              {addOpen && (
                <div className={`absolute top-full right-0 mt-1 z-[600] w-80 border rounded-xl shadow-xl ${isDark ? 'bg-[#1e3350] border-[#2d4a68]' : 'bg-white border-gray-100'}`}>
                  {/* Search */}
                  <div className={`p-2 border-b ${isDark ? 'border-[#2d4a68]' : 'border-gray-100'}`}>
                    <div className="relative">
                      <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`} />
                      <input
                        autoFocus
                        className={`w-full pl-8 pr-3 py-2 rounded-lg text-sm focus:outline-none border ${isDark ? 'bg-[#0a1929] border-[#2d4a68] text-[#e2e8f0] placeholder-[#4a6580]' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
                        placeholder="Search fields..."
                        value={addQuery}
                        onChange={e => setAddQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Select All / Deselect All + count */}
                  {filteredAvailable.length > 0 && (
                    <div className={`px-3 py-2 border-b flex items-center gap-2 sticky top-0 z-10 ${isDark ? 'border-[#2d4a68] bg-[#1e3350]' : 'border-gray-100 bg-white'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          const allKeys = new Set(filteredAvailable.map(f => f.key));
                          setCheckedFieldKeys(allKeys);
                        }}
                        className={`text-xs px-2 py-1 rounded font-medium ${isDark ? 'text-[#60a5fa] hover:bg-[#243b53]' : 'text-brand-700 hover:bg-brand-50'}`}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckedFieldKeys(new Set())}
                        className={`text-xs px-2 py-1 rounded font-medium ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-500 hover:bg-red-50'}`}
                      >
                        Clear
                      </button>
                      <span className={`ml-auto text-xs py-1 ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`}>
                        {checkedFieldKeys.size > 0 ? `${checkedFieldKeys.size} selected` : `${filteredAvailable.length} available`}
                      </span>
                    </div>
                  )}

                  <div className="max-h-72 overflow-y-auto">
                    {Object.entries(availableBySection).map(([section, fields]) => (
                      <div key={section}>
                        {/* Section header with section-level check */}
                        <div className={`px-3 py-1.5 flex items-center gap-2 sticky top-0 z-[5] ${isDark ? 'text-[#4d6d8a] bg-[#0a1929]' : 'text-gray-400 bg-gray-50'}`}>
                          <button
                            type="button"
                            onClick={() => {
                              const sectionKeys = fields.map(f => f.key);
                              const allChecked = sectionKeys.every(k => checkedFieldKeys.has(k));
                              setCheckedFieldKeys(prev => {
                                const next = new Set(prev);
                                if (allChecked) sectionKeys.forEach(k => next.delete(k));
                                else sectionKeys.forEach(k => next.add(k));
                                return next;
                              });
                            }}
                            className="flex items-center gap-1.5"
                          >
                            <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[9px] font-bold
                              ${fields.every(f => checkedFieldKeys.has(f.key))
                                ? (isDark ? 'bg-[#60a5fa] border-[#60a5fa] text-white' : 'bg-brand-600 border-brand-600 text-white')
                                : fields.some(f => checkedFieldKeys.has(f.key))
                                  ? (isDark ? 'bg-[#243b53] border-[#4d6d8a] text-[#60a5fa]' : 'bg-brand-100 border-brand-400 text-brand-700')
                                  : (isDark ? 'border-[#4d6d8a]' : 'border-gray-300')}`}
                            >
                              {fields.every(f => checkedFieldKeys.has(f.key)) ? '✓' : fields.some(f => checkedFieldKeys.has(f.key)) ? '–' : ''}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">{section}</span>
                          </button>
                        </div>
                        {fields.map(f => (
                          <button
                            key={f.key}
                            type="button"
                            onClick={() => {
                              setCheckedFieldKeys(prev => {
                                const next = new Set(prev);
                                if (next.has(f.key)) next.delete(f.key);
                                else next.add(f.key);
                                return next;
                              });
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5
                              ${checkedFieldKeys.has(f.key)
                                ? (isDark ? 'text-[#e2e8f0] font-medium bg-[#243b53]' : 'text-brand-800 font-medium bg-brand-50')
                                : (isDark ? 'text-[#94a3b8] hover:bg-[#243b53] hover:text-[#e2e8f0]' : 'text-gray-700 hover:bg-brand-50 hover:text-brand-800')}`}
                          >
                            {/* Checkbox */}
                            <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[9px] font-bold
                              ${checkedFieldKeys.has(f.key)
                                ? (isDark ? 'bg-[#60a5fa] border-[#60a5fa] text-white' : 'bg-brand-600 border-brand-600 text-white')
                                : (isDark ? 'border-[#4d6d8a]' : 'border-gray-300')}`}
                            >
                              {checkedFieldKeys.has(f.key) && '✓'}
                            </span>
                            <span className="flex-1">{f.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-[#0a1929] text-[#4d6d8a]' : 'bg-gray-100 text-gray-400'}`}>
                              {f.type}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                    {filteredAvailable.length === 0 && (
                      <div className={`px-4 py-6 text-sm text-center ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`}>
                        All fields added or no match
                      </div>
                    )}
                  </div>

                  {/* Footer: Apply Selection button */}
                  <div className={`px-3 py-2.5 border-t ${isDark ? 'border-[#2d4a68] bg-[#0a1929]' : 'border-gray-100 bg-gray-50'}`}>
                    <button
                      type="button"
                      onClick={() => {
                        const existingKeys = new Set(rows.map(r => r.field.key));
                        setRows(prev => {
                          const kept = prev.filter(r => checkedFieldKeys.has(r.field.key));
                          const newRows: FilterRow[] = [];
                          checkedFieldKeys.forEach(key => {
                            if (!existingKeys.has(key)) {
                              const field = FILTER_FIELDS.find(f => f.key === key);
                              if (field) {
                                newRows.push({ id: `${key}_${Date.now()}_${Math.random()}`, field, value: '', valueTo: '' });
                              }
                            }
                          });
                          return [...kept, ...newRows];
                        });
                        setCheckedFieldKeys(new Set());
                        setAddOpen(false);
                        setAddQuery('');
                      }}
                      className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${isDark ? 'bg-[#60a5fa] text-[#0a1929] hover:bg-[#93c5fd]' : 'bg-brand-700 text-white hover:bg-brand-800'}`}
                    >
                      Apply Selection
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Empty state */}
          {rows.length === 0 && (
            <div className={`flex flex-col items-center justify-center py-16 gap-3 rounded-xl border-2 border-dashed ${isDark ? 'border-[#1e3350] text-[#4d6d8a]' : 'border-gray-200 text-gray-400'}`}>
              <SlidersHorizontal className="w-8 h-8 opacity-40" />
              <div className="text-center">
                <p className="text-sm font-medium">No filters added</p>
                <p className="text-xs mt-1 opacity-70">Click &quot;Add Filter Field&quot; to begin</p>
              </div>
            </div>
          )}

          {/* Filter rows grouped by section */}
          {Object.entries(rowsBySection).map(([section, sectionRows]) => (
            <div key={section} className="mb-5">
              <button
                type="button"
                onClick={() => setCollapsedSections(s => ({ ...s, [section]: !s[section] }))}
                className={`w-full flex items-center gap-2 pb-1.5 mb-3 border-b text-left ${sectionCls} ${borderCls}`}
              >
                <span className="text-xs font-bold uppercase tracking-widest flex-1">{section}</span>
                {collapsedSections[section]
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronUp className="w-3.5 h-3.5" />}
              </button>

              {!collapsedSections[section] && (
                <div className="flex flex-col gap-3">
                  {sectionRows.map(row => (
                    <div key={row.id} className={`rounded-xl p-3 border ${cardBg}`}>
                      <div className="flex items-center justify-between mb-2">
                        <label className={`text-xs font-semibold ${labelCls}`}>
                          {row.field.label}
                          {row.field.dependsOn && (
                            <span className={`ml-1 text-[10px] italic ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`}>
                              (depends on Source)
                            </span>
                          )}
                        </label>
                        <button
                          onClick={() => removeRow(row.id)}
                          className="w-5 h-5 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Remove filter"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <FilterRowInput
                        row={row}
                        isDark={isDark}
                        fieldValues={fieldValues}
                        loadingKeys={loadingKeys}
                        allRows={rows}
                        onChangeMulti={handleChangeMulti}
                        onChangeText={handleChangeText}
                        onChangeDateTo={handleChangeDateTo}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-2 px-5 py-4 border-t flex-shrink-0 ${headerBg} ${borderCls}`}>
          {rows.length > 0 && (
            <button
              onClick={handleReset}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition-colors ${isDark ? 'border-red-700 text-red-400 hover:bg-red-900/20' : 'border-red-200 text-red-500 hover:bg-red-50'}`}
            >
              <RefreshCw className="w-3 h-3" /> Clear All
            </button>
          )}
          <button
            onClick={onClose}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border transition-colors ${isDark ? 'border-[#2d4a68] text-[#94a3b8] hover:bg-[#1e3350]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Filter className="w-3.5 h-3.5" />
            Apply Filters
            {activeCount > 0 && (
              <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{activeCount}</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}