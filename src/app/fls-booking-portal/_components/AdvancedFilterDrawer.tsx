'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X, SlidersHorizontal, Plus, Trash2, Search,
  ChevronDown, ChevronUp, Filter, RefreshCw,
} from 'lucide-react';
import api from '../../../lib/api';
import DarkDatePicker from './DarkDatePicker';
import { useFlsTheme } from './FlsThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType = 'text' | 'dropdown' | 'date' | 'status' | 'boolean' | 'number';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  section: string;
  optionsKey?: string;
  staticOptions?: { label: string; value: string }[];
}

interface DynamicFilter {
  id: string;
  field: FieldDef;
  value: string;
  valueTo?: string;
}

interface Opt { label: string; value: string }

// ─── All available filter fields ─────────────────────────────────────────────

const ALL_FIELDS: FieldDef[] = [
  // Booking Details
  { key: 'project', label: 'Project', type: 'text', section: 'Booking Details' },
  { key: 'region', label: 'Region', type: 'text', section: 'Booking Details' },
  { key: 'stock', label: 'Stock', type: 'text', section: 'Booking Details' },
  { key: 'pl_team', label: 'P & L Team', type: 'text', section: 'Booking Details' },
  { key: 'type', label: 'Type', type: 'text', section: 'Booking Details' },
  { key: 'con', label: 'CON', type: 'text', section: 'Booking Details' },
  { key: 'booking_form_date', label: 'Booking Form Date', type: 'date', section: 'Booking Details' },
  { key: 'login_counter_date', label: 'Login Counter Date', type: 'date', section: 'Booking Details' },
  { key: 'booking_form_status', label: 'Booking Form Status', type: 'text', section: 'Booking Details' },
  { key: 'form_type', label: 'Form Type', type: 'text', section: 'Booking Details' },
  { key: 'bf_received_date', label: 'BF Received Date', type: 'date', section: 'Booking Details' },
  { key: 'hold_date', label: 'Hold Date', type: 'date', section: 'Booking Details' },
  { key: 'file_transfer_date', label: 'File Transfer Date', type: 'date', section: 'Booking Details' },
  { key: 'lbc_date', label: 'LBC Date', type: 'date', section: 'Booking Details' },
  { key: 'scheme', label: 'Scheme', type: 'text', section: 'Booking Details' },
  { key: 'values_amount', label: 'Values / Amount', type: 'text', section: 'Booking Details' },
  { key: 'payment_mode', label: 'Payment Mode', type: 'text', section: 'Booking Details' },
  { key: 'booking_amount', label: 'Booking Amount', type: 'text', section: 'Booking Details' },
  { key: 'acknowledgement', label: 'Acknowledgement', type: 'text', section: 'Booking Details' },

  // Customer Details
  { key: 'phone_number_1', label: 'Mobile Number', type: 'text', section: 'Customer Details' },
  { key: 'mail_id_1', label: 'Email ID', type: 'text', section: 'Customer Details' },
  { key: 'customer_type', label: 'Customer Type', type: 'text', section: 'Customer Details' },

  // Executive Details
  { key: 'fls_agent', label: 'FLS ID - Name', type: 'dropdown', section: 'Executive Details', optionsKey: 'fls_agents' },
  { key: 'mgr_agent', label: 'Manager ID - Name', type: 'dropdown', section: 'Executive Details', optionsKey: 'mgr_agents' },
  { key: 'avp_agent', label: 'AVP ID - Name', type: 'dropdown', section: 'Executive Details', optionsKey: 'avp_agents' },

  // Source Details
  { key: 'source', label: 'Source', type: 'text', section: 'Source Details' },
  { key: 'sub_source', label: 'Sub Source', type: 'text', section: 'Source Details' },
  { key: 'source_customer_name', label: 'Source Customer Name', type: 'text', section: 'Source Details' },
  { key: 'pushed_date', label: 'Pushed Date', type: 'date', section: 'Source Details' },
  { key: 'iden_date', label: 'Iden Date', type: 'date', section: 'Source Details' },
  { key: 'walk_in_date', label: 'Walk In Date', type: 'date', section: 'Source Details' },

  // Status Details
  {
    key: 'checking_verify_status', label: 'Checking Verify Status', type: 'status', section: 'Status Details',
    staticOptions: [
      { label: 'Verified', value: 'verified' },
      { label: 'Hold', value: 'hold' },
      { label: 'Canceled', value: 'canceled' },
    ],
  },
  {
    key: 'source_verify_status', label: 'Source Verify Status', type: 'status', section: 'Status Details',
    staticOptions: [
      { label: 'Verified', value: 'verified' },
      { label: 'Hold', value: 'hold' },
      { label: 'Canceled', value: 'canceled' },
    ],
  },
  {
    key: 'msp', label: 'MSP', type: 'status', section: 'Status Details',
    staticOptions: [
      { label: 'Villa', value: 'villa' },
      { label: 'Apartment', value: 'apartment' },
      { label: 'Others', value: 'others' },
    ],
  },
  { key: 'pdc_status', label: 'PDC Status', type: 'text', section: 'Status Details' },

  // Verification Details
  { key: 'sf_record_id', label: 'SF Record ID', type: 'text', section: 'Verification Details' },
  { key: 'status_of_cit_verification', label: 'CIT Verification Status', type: 'text', section: 'Verification Details' },
  { key: 'verified_by_whom', label: 'Verified By Whom', type: 'text', section: 'Verification Details' },
  { key: 'verified_date', label: 'Verified Date', type: 'date', section: 'Verification Details' },
  { key: 'sent_for_cit_verification_date', label: 'CIT Sent Date', type: 'date', section: 'Verification Details' },

  // Date Filters
  { key: 'createdAt', label: 'Created Date', type: 'date', section: 'Date Filters' },

  // Lead Details
  { key: 'sf_lead_id1', label: 'SF Lead ID 1', type: 'text', section: 'Lead Details' },
  { key: 'sf_lead2', label: 'SF Lead ID 2', type: 'text', section: 'Lead Details' },
  { key: 'sf_lead3', label: 'SF Lead ID 3', type: 'text', section: 'Lead Details' },
  { key: 'sell_do_lead1', label: 'Sell Do Lead 1', type: 'text', section: 'Lead Details' },
  { key: 'sell_do_lead2', label: 'Sell Do Lead 2', type: 'text', section: 'Lead Details' },
  { key: 'sell_do_lead3', label: 'Sell Do Lead 3', type: 'text', section: 'Lead Details' },
  { key: 'sf_lead1_clone', label: 'SF Lead 1 Clone', type: 'text', section: 'Lead Details' },
  { key: 'sf_lead2_clone', label: 'SF Lead 2 Clone', type: 'text', section: 'Lead Details' },
  { key: 'sf_lead3_clone', label: 'SF Lead 3 Clone', type: 'text', section: 'Lead Details' },
  { key: 'sf_lead_id1_owner', label: 'SF Lead ID 1 Owner', type: 'text', section: 'Lead Details' },
  { key: 'pushed_date_lead1', label: 'Pushed Date Lead 1', type: 'date', section: 'Lead Details' },
  { key: 'sf_lead1_walkin_date', label: 'SF Lead 1 Walkin Date', type: 'date', section: 'Lead Details' },
  { key: 'walkin_project_lead1', label: 'Walkin Project Lead 1', type: 'text', section: 'Lead Details' },
  { key: 'sf_lead_id2_owner', label: 'SF Lead ID 2 Owner', type: 'text', section: 'Lead Details' },
  { key: 'pushed_date_lead2', label: 'Pushed Date Lead 2', type: 'date', section: 'Lead Details' },
  { key: 'sf_lead2_walkin_date', label: 'SF Lead 2 Walkin Date', type: 'date', section: 'Lead Details' },
  { key: 'walkin_project_lead2', label: 'Walkin Project Lead 2', type: 'text', section: 'Lead Details' },
  { key: 'sf_lead_id3_owner', label: 'SF Lead ID 3 Owner', type: 'text', section: 'Lead Details' },
  { key: 'pushed_date_lead3', label: 'Pushed Date Lead 3', type: 'date', section: 'Lead Details' },
  { key: 'sf_lead3_walkin_date', label: 'SF Lead 3 Walkin Date', type: 'date', section: 'Lead Details' },
  { key: 'walkin_project_lead3', label: 'Walkin Project Lead 3', type: 'text', section: 'Lead Details' },
  { key: 'lead_remarks', label: 'Lead Remarks', type: 'text', section: 'Lead Details' },

  // Unit Details
  { key: 'unit_no', label: 'Unit No', type: 'text', section: 'Unit Details' },
  { key: 'swap_from_unit_details', label: 'Swap From Unit Details', type: 'text', section: 'Unit Details' },
  { key: 'name', label: 'Name', type: 'text', section: 'Unit Details' },
  { key: 'rs_in_crs', label: 'Rs in Crs', type: 'text', section: 'Unit Details' },
  { key: 'net_sales', label: 'Net Sales', type: 'text', section: 'Unit Details' },
  { key: 'gross_sales', label: 'Gross Sales', type: 'text', section: 'Unit Details' },

  // Booking Extra Details
  { key: 'booking_form_received_by_whom', label: 'BF Received By Whom', type: 'text', section: 'Booking Details' },
  { key: 'file_transfer_details', label: 'File Transfer Details', type: 'text', section: 'Booking Details' },
  { key: 'remarks', label: 'Remarks', type: 'text', section: 'Booking Details' },
  { key: 'login_before_cancel_remarks', label: 'Login Before Cancel Remarks', type: 'text', section: 'Booking Details' },

  // Executive ID Details
  { key: 'fls_id', label: 'FLS ID', type: 'text', section: 'Executive Details' },
  { key: 'fls_name', label: 'FLS Name', type: 'text', section: 'Executive Details' },
  { key: 'mgr_id', label: 'Manager ID', type: 'text', section: 'Executive Details' },
  { key: 'mgr_name', label: 'Manager Name', type: 'text', section: 'Executive Details' },
  { key: 'avp_id', label: 'AVP ID', type: 'text', section: 'Executive Details' },
  { key: 'avp_name', label: 'AVP Name', type: 'text', section: 'Executive Details' },

  // Acknowledgement
  { key: 'acknowledgement_remarks', label: 'Acknowledgement Remarks', type: 'text', section: 'Booking Details' },

  // PDC Details
  { key: 'pdc_cheque_received', label: 'PDC Cheque Received', type: 'text', section: 'PDC Details' },
  { key: 'pdc_amount', label: 'PDC Amount', type: 'text', section: 'PDC Details' },
  { key: 'pdc_date', label: 'PDC Date', type: 'date', section: 'PDC Details' },
  { key: 'pdc_cheque_no', label: 'PDC Cheque No', type: 'text', section: 'PDC Details' },
  { key: 'bank_name_pdc', label: 'Bank Name (PDC)', type: 'text', section: 'PDC Details' },

  // Payment Details
  { key: 'payment_confirmation_with_confirmed_date', label: 'Payment Confirmation Date', type: 'text', section: 'Payment Details' },
  { key: 'cheque_date', label: 'Cheque Date', type: 'date', section: 'Payment Details' },
  { key: 'cheque_no', label: 'Cheque No', type: 'text', section: 'Payment Details' },
  { key: 'bank_name', label: 'Bank Name', type: 'text', section: 'Payment Details' },

  // Customer Extra
  { key: 'phone_number_2', label: 'Phone Number 2', type: 'text', section: 'Customer Details' },
  { key: 'phone_number_3', label: 'Phone Number 3', type: 'text', section: 'Customer Details' },
  { key: 'phone_number_4', label: 'Phone Number 4', type: 'text', section: 'Customer Details' },
  { key: 'mail_id_2', label: 'Email ID 2', type: 'text', section: 'Customer Details' },
  { key: 'mail_id_3', label: 'Email ID 3', type: 'text', section: 'Customer Details' },
  { key: 'mail_id_4', label: 'Email ID 4', type: 'text', section: 'Customer Details' },

  // Source Extra
  { key: 'source_taken_lead', label: 'Source Taken Lead', type: 'text', section: 'Source Details' },
  { key: 'source_remarks', label: 'Source Remarks', type: 'text', section: 'Source Details' },

  // MSP / Pricing Details
  { key: 'taken_price', label: 'Taken Price', type: 'text', section: 'MSP / Pricing' },
  { key: 'discount', label: 'Discount', type: 'text', section: 'MSP / Pricing' },
  { key: 'land_cost', label: 'Land Cost', type: 'text', section: 'MSP / Pricing' },
  { key: 'construction_cost', label: 'Construction Cost', type: 'text', section: 'MSP / Pricing' },
  { key: 'msp_custom_amount', label: 'MSP Custom Amount', type: 'text', section: 'MSP / Pricing' },
  { key: 'offer', label: 'Offer', type: 'text', section: 'MSP / Pricing' },
  { key: 'offer_description', label: 'Offer Description', type: 'text', section: 'MSP / Pricing' },
  { key: 'upfront_details', label: 'Upfront Details', type: 'text', section: 'MSP / Pricing' },
  { key: 'description', label: 'Description', type: 'text', section: 'MSP / Pricing' },
];

// ─── Default fields shown when drawer is opened for the first time ────────────
// Priority: all date fields + all status/dropdown fields + key booking fields
const DEFAULT_FILTER_KEYS: string[] = [
  // Date Filters (section)
  'createdAt',
  // Booking Detail dates
  'booking_form_date',
  'login_counter_date',
  'bf_received_date',
  'hold_date',
  'file_transfer_date',
  'lbc_date',
  // Verification dates
  'verified_date',
  'sent_for_cit_verification_date',
  // Source dates
  'pushed_date',
  'iden_date',
  'walk_in_date',
  // Status dropdowns
  'checking_verify_status',
  'source_verify_status',
  'msp',
  'pdc_status',
  // Executive dropdowns
  'fls_agent',
  'mgr_agent',
  'avp_agent',
  // Key booking text fields
  'booking_form_status',
  'payment_mode',
];

// ─── SearchableSelect ─────────────────────────────────────────────────────────

function SearchableSelect({
  value, onChange, options, placeholder, isDark = false,
}: {
  value: string; onChange: (v: string) => void; options: Opt[];
  placeholder: string; isDark?: boolean;
}) {
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

  const filtered = query ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())) : options;
  const selectedLabel = options.find(o => o.value === value)?.label ?? '';

  const base = isDark
    ? 'bg-[#1e3350] border-[#2d4a68] text-[#e2e8f0]'
    : 'bg-white border-gray-200 text-gray-800';

  return (
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => { setQuery(''); setOpen(true); }}
        className={`flex items-center border rounded-lg cursor-pointer shadow-sm ${base} focus-within:ring-1 ${isDark ? 'focus-within:ring-[#3d6b9e] focus-within:border-[#3d6b9e]' : 'focus-within:ring-brand-500 focus-within:border-brand-500'}`}
      >
        <Search className={`w-3.5 h-3.5 ml-2.5 shrink-0 ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`} />
        <input
          className={`flex-1 px-2 py-2 bg-transparent text-sm focus:outline-none min-w-0 ${isDark ? 'text-[#e2e8f0] placeholder-[#4a6580]' : 'text-gray-800 placeholder-gray-400'}`}
          placeholder={placeholder}
          value={open ? query : selectedLabel}
          onFocus={() => { setQuery(''); setOpen(true); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
        {value && !open && (
          <button onClick={e => { e.stopPropagation(); onChange(''); setQuery(''); }} className={`pr-1.5 shrink-0 ${isDark ? 'text-[#4d6d8a] hover:text-[#94a3b8]' : 'text-gray-300 hover:text-gray-600'}`}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronDown className={`w-3.5 h-3.5 mr-2 transition-transform shrink-0 ${open ? 'rotate-180' : ''} ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`} />
      </div>
      {open && (
        <div className={`absolute top-full left-0 mt-1 z-[400] border rounded-xl shadow-lg max-h-52 overflow-y-auto min-w-full ${isDark ? 'bg-[#1e3350] border-[#2d4a68]' : 'bg-white border-gray-100'}`}>
          {filtered.length === 0
            ? <div className={`px-4 py-3 text-sm text-center ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`}>No matches</div>
            : filtered.map(opt => (
              <button key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl
                  ${value === opt.value
                    ? (isDark ? 'text-[#e2e8f0] font-medium bg-[#243b53]' : 'text-brand-800 font-medium bg-brand-50')
                    : (isDark ? 'text-[#94a3b8] hover:bg-[#243b53]' : 'text-gray-700 hover:bg-gray-50')}`}
              >
                {opt.label}
              </button>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ─── FilterInput ──────────────────────────────────────────────────────────────

function FilterInput({
  field, value, valueTo, onChange, onChangeTo, isDark, allOptions,
}: {
  field: FieldDef; value: string; valueTo?: string;
  onChange: (v: string) => void; onChangeTo?: (v: string) => void;
  isDark: boolean; allOptions: Record<string, Opt[]>;
}) {
  const inputCls = isDark
    ? 'bg-[#1e3350] border-[#2d4a68] text-[#e2e8f0] placeholder-[#4a6580] focus:ring-[#3d6b9e] focus:border-[#3d6b9e]'
    : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-brand-500 focus:border-brand-500';

  if (field.type === 'date') {
    return (
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1">
          <DarkDatePicker value={value} onChange={onChange} placeholder="From date" compact />
        </div>
        <span className={`text-xs shrink-0 ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`}>→</span>
        <div className="flex-1">
          <DarkDatePicker value={valueTo || ''} onChange={onChangeTo || (() => { })} placeholder="To date" compact />
        </div>
      </div>
    );
  }

  if (field.type === 'dropdown' && field.optionsKey) {
    const opts = allOptions[field.optionsKey] || [];
    return <SearchableSelect value={value} onChange={onChange} options={opts} placeholder={`Select ${field.label}`} isDark={isDark} />;
  }

  if ((field.type === 'status' || field.type === 'boolean') && field.staticOptions) {
    return <SearchableSelect value={value} onChange={onChange} options={field.staticOptions} placeholder={`Select ${field.label}`} isDark={isDark} />;
  }

  return (
    <input
      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 shadow-sm transition-colors ${inputCls}`}
      placeholder={`Enter ${field.label.toLowerCase()}...`}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AdvancedFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  // Filters that are already in basic filter bar — exclude from drawer
  excludeKeys?: string[];
  // Called when user clicks Apply — passes all extra filter params
  onApply: (filters: Record<string, string>) => void;
  // Current active extra filters (for badge count, reset)
  activeFilters: Record<string, string>;
  theme?: 'blue' | 'green' | 'purple';
  storageKey?: string;
}

const STORAGE_VERSION = 'v2'; // bumped: full field list added

export default function AdvancedFilterDrawer({
  open,
  onClose,
  excludeKeys = ['search', 'fls_agent', 'mgr_agent', 'avp_agent', 'customer_name'],
  onApply,
  activeFilters,
  storageKey = 'fls_adv_drawer',
}: AdvancedFilterDrawerProps) {
  const { isDark } = useFlsTheme();

  // API options
  const [allOptions, setAllOptions] = useState<Record<string, Opt[]>>({});

  // Dynamic filter rows
  const [dynamicFilters, setDynamicFilters] = useState<DynamicFilter[]>([]);

  // Add-field dropdown
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [addFieldQuery, setAddFieldQuery] = useState('');
  const addFieldRef = useRef<HTMLDivElement>(null);

  // Section collapse
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Load options from API once
  useEffect(() => {
    api.get('/fls-booking/options').then(res => {
      const d = res.data?.data || {};
      setAllOptions({
        unit_nos: (d.unit_nos || []).map((v: string) => ({ label: v, value: v })),
        fls_agents: (d.fls_agents || []).map((a: any) => ({
          label: a.fls_name ? `${a.fls_id} - ${a.fls_name}` : a.fls_id,
          value: a.fls_id || a.fls_name,
        })),
        mgr_agents: (d.mgr_agents || []).map((a: any) => ({
          label: a.mgr_name ? `${a.mgr_id} - ${a.mgr_name}` : a.mgr_id,
          value: a.mgr_id || a.mgr_name,
        })),
        avp_agents: (d.avp_agents || []).map((a: any) => ({
          label: a.avp_name ? `${a.avp_id} - ${a.avp_name}` : a.avp_id,
          value: a.avp_id || a.avp_name,
        })),
        customers: (d.customers || []).map((c: { name: string }) => ({ label: c.name, value: c.name })),
      });
    }).catch(() => { });
  }, []);

  // Restore from localStorage, or seed default fields when list is empty
  useEffect(() => {
    const buildDefaults = (): DynamicFilter[] =>
      DEFAULT_FILTER_KEYS
        .map(key => ALL_FIELDS.find(f => f.key === key))
        .filter((f): f is FieldDef => f !== undefined)
        .map(field => ({ id: `${field.key}_default`, field, value: '', valueTo: '' }));

    try {
      const saved = localStorage.getItem(`${storageKey}_${STORAGE_VERSION}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if there are actual filters saved; otherwise seed defaults
        if (Array.isArray(parsed.dynamicFilters) && parsed.dynamicFilters.length > 0) {
          setDynamicFilters(parsed.dynamicFilters);
          return;
        }
      }
    } catch { }
    // No saved filters or empty array — pre-populate with default important fields
    setDynamicFilters(buildDefaults());
  }, [storageKey]);

  // Persist to localStorage — only save when the user has actually filled in at least one value
  // or has customised the field list (added/removed compared to defaults).
  // This prevents an all-blank default state from being written and blocking future seeding.
  useEffect(() => {
    const hasCustomisation =
      dynamicFilters.some(f => f.value) ||
      dynamicFilters.length !== DEFAULT_FILTER_KEYS.length ||
      dynamicFilters.some((f, i) => f.field.key !== DEFAULT_FILTER_KEYS[i]);
    try {
      if (hasCustomisation) {
        localStorage.setItem(`${storageKey}_${STORAGE_VERSION}`, JSON.stringify({ dynamicFilters }));
      } else {
        // Default blank state — remove so next open re-seeds cleanly
        localStorage.removeItem(`${storageKey}_${STORAGE_VERSION}`);
      }
    } catch { }
  }, [dynamicFilters, storageKey]);

  // Close add-field dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (addFieldRef.current && !addFieldRef.current.contains(e.target as Node)) setAddFieldOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Active count badge
  const activeCount = dynamicFilters.filter(f => f.value).length;

  // Apply
  const handleApply = useCallback(() => {
    const extra: Record<string, string> = {};
    dynamicFilters.forEach(f => {
      if (f.value) {
        extra[f.field.key] = f.value;
        if (f.field.type === 'date' && f.valueTo) {
          extra[`${f.field.key}_to`] = f.valueTo;
        }
      }
    });
    onApply(extra);
    onClose();
  }, [dynamicFilters, onApply, onClose]);

  // Reset
  const handleReset = () => {
    // Clear localStorage first so the persist effect doesn't re-save an empty array
    try { localStorage.removeItem(`${storageKey}_${STORAGE_VERSION}`); } catch { }
    // Restore default fields (with empty values) instead of going completely blank
    const defaults: DynamicFilter[] = DEFAULT_FILTER_KEYS
      .map(key => ALL_FIELDS.find(f => f.key === key))
      .filter((f): f is FieldDef => f !== undefined)
      .map(field => ({ id: `${field.key}_default`, field, value: '', valueTo: '' }));
    setDynamicFilters(defaults);
    onApply({});
  };

  // Add dynamic filter
  const addDynamicFilter = (field: FieldDef, keepOpen = false) => {
    if (dynamicFilters.some(f => f.field.key === field.key)) return;
    setDynamicFilters(prev => [...prev, { id: `${field.key}_${Date.now()}`, field, value: '', valueTo: '' }]);
    if (!keepOpen) {
      setAddFieldOpen(false);
      setAddFieldQuery('');
    }
  };

  const removeDynamicFilter = (id: string) => setDynamicFilters(prev => prev.filter(f => f.id !== id));

  const updateDynamicFilter = (id: string, value: string, isTo?: boolean) => {
    setDynamicFilters(prev => prev.map(f =>
      f.id === id ? { ...f, ...(isTo ? { valueTo: value } : { value }) } : f,
    ));
  };

  // Available fields (not already added, not in basic bar)
  const usedKeys = new Set([...excludeKeys, ...dynamicFilters.map(f => f.field.key)]);
  const availableFields = ALL_FIELDS.filter(f => !usedKeys.has(f.key));
  const filteredAvailable = addFieldQuery
    ? availableFields.filter(f =>
      f.label.toLowerCase().includes(addFieldQuery.toLowerCase()) ||
      f.section.toLowerCase().includes(addFieldQuery.toLowerCase())
    )
    : availableFields;

  // Group dynamic filters by section
  const dynamicBySection = dynamicFilters.reduce<Record<string, DynamicFilter[]>>((acc, f) => {
    const s = f.field.section;
    if (!acc[s]) acc[s] = [];
    acc[s].push(f);
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

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>

          {/* Add Filter button */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`}>
              Filter Fields
            </span>
            <div className="relative" ref={addFieldRef}>
              <button
                onClick={() => { setAddFieldOpen(v => !v); setAddFieldQuery(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'bg-[#1e3350] border-[#3d6b9e] text-[#60a5fa] hover:bg-[#243b53]' : 'bg-white border-brand-300 text-brand-700 hover:bg-brand-50'}`}
              >
                <Plus className="w-3.5 h-3.5" /> Add Filter Field
              </button>

              {addFieldOpen && (
                <div className={`absolute top-full right-0 mt-1 z-[600] w-72 border rounded-xl shadow-xl ${isDark ? 'bg-[#1e3350] border-[#2d4a68]' : 'bg-white border-gray-100'}`}>
                  <div className={`p-2 border-b ${isDark ? 'border-[#2d4a68]' : 'border-gray-100'}`}>
                    <div className="relative">
                      <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-[#4d6d8a]' : 'text-gray-400'}`} />
                      <input
                        autoFocus
                        className={`w-full pl-8 pr-3 py-2 rounded-lg text-sm focus:outline-none border ${isDark ? 'bg-[#0a1929] border-[#2d4a68] text-[#e2e8f0] placeholder-[#4a6580]' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
                        placeholder="Search fields..."
                        value={addFieldQuery}
                        onChange={e => setAddFieldQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Select All */}
                  {filteredAvailable.length > 0 && (
                    <div className={`px-3 py-2 border-b ${isDark ? 'border-[#2d4a68]' : 'border-gray-100'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          filteredAvailable.forEach(f => addDynamicFilter(f, true));
                          setAddFieldOpen(false);
                          setAddFieldQuery('');
                        }}
                        className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                          ${isDark ? 'bg-[#243b53] border-[#3d6b9e] text-[#60a5fa] hover:bg-[#2d4a68]' : 'bg-brand-50 border-brand-300 text-brand-700 hover:bg-brand-100'}`}
                      >
                        <Plus className="w-3 h-3" /> Select All ({filteredAvailable.length} fields)
                      </button>
                    </div>
                  )}
                  <div className="max-h-72 overflow-y-auto">
                    {Object.entries(
                      filteredAvailable.reduce<Record<string, FieldDef[]>>((acc, f) => {
                        if (!acc[f.section]) acc[f.section] = [];
                        acc[f.section].push(f);
                        return acc;
                      }, {})
                    ).map(([section, fields]) => (
                      <div key={section}>
                        <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest sticky top-0 ${isDark ? 'text-[#4d6d8a] bg-[#0a1929]' : 'text-gray-400 bg-gray-50'}`}>
                          {section}
                        </div>
                        {fields.map(f => (
                          <button key={f.key} type="button"
                            onClick={() => addDynamicFilter(f)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${isDark ? 'text-[#94a3b8] hover:bg-[#243b53] hover:text-[#e2e8f0]' : 'text-gray-700 hover:bg-brand-50 hover:text-brand-800'}`}
                          >
                            <span>{f.label}</span>
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
                </div>
              )}
            </div>
          </div>

          {/* Empty state */}
          {Object.keys(dynamicBySection).length === 0 && (
            <div className={`flex flex-col items-center justify-center py-16 gap-3 rounded-xl border-2 border-dashed ${isDark ? 'border-[#1e3350] text-[#4d6d8a]' : 'border-gray-200 text-gray-400'}`}>
              <SlidersHorizontal className="w-8 h-8 opacity-40" />
              <div className="text-center">
                <p className="text-sm font-medium">No filters added</p>
                <p className="text-xs mt-1 opacity-70">Click &quot;Add Filter Field&quot; to begin</p>
              </div>
            </div>
          )}

          {/* Dynamic filter groups */}
          {Object.entries(dynamicBySection).map(([section, filters]) => (
            <div key={section} className="mb-5">
              {/* Section header */}
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
                  {filters.map(df => (
                    <div key={df.id} className={`rounded-xl p-3 border ${cardBg}`}>
                      <div className="flex items-center justify-between mb-2">
                        <label className={`text-xs font-semibold ${labelCls}`}>{df.field.label}</label>
                        <button
                          onClick={() => removeDynamicFilter(df.id)}
                          className="w-5 h-5 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 transition-colors"
                          title="Remove filter"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <FilterInput
                        field={df.field}
                        value={df.value}
                        valueTo={df.valueTo}
                        onChange={v => updateDynamicFilter(df.id, v)}
                        onChangeTo={v => updateDynamicFilter(df.id, v, true)}
                        isDark={isDark}
                        allOptions={allOptions}
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
          {activeCount > 0 && (
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