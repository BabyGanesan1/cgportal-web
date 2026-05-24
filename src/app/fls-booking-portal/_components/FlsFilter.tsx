'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, X, Download, Plus, Filter, RefreshCw, SlidersHorizontal } from 'lucide-react';
import AdvancedFilterDrawer from './AdvancedFilterDrawer';
import api from '../../../lib/api';
import DarkDatePicker from './DarkDatePicker';
import { useFlsTheme } from './FlsThemeContext';

const DATE_PRESETS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'date_range', label: 'Date Range' },
];

function computeDateRange(preset: string): { from: string; to: string } | null {
  const fmt = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  switch (preset) {
    case 'today': return { from: fmt(today), to: fmt(today) };
    case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return { from: fmt(y), to: fmt(y) }; }
    case 'this_week': {
      const dow = today.getDay();
      const mon = new Date(today); mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { from: fmt(mon), to: fmt(sun) };
    }
    case 'last_week': {
      const dow = today.getDay();
      const mon = new Date(today); mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) - 7);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { from: fmt(mon), to: fmt(sun) };
    }
    case 'this_month': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { from: fmt(first), to: fmt(last) };
    }
    case 'last_month': {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: fmt(first), to: fmt(last) };
    }
    default: return null;
  }
}

interface Opt { label: string; value: string }

interface SearchableSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  placeholder: string;
  width?: string;
  isDark?: boolean;
}

function SearchableSelect({ value, onChange, options, placeholder, width = 'w-36', isDark = false }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())) : options;
  const selectedLabel = options.find(o => o.value === value)?.label ?? '';

  const triggerCls = isDark
    ? 'bg-[#1e3350] border-[#2d4a68] focus-within:ring-[#3d6b9e] focus-within:border-[#3d6b9e]'
    : 'bg-white border-brand-200 focus-within:ring-brand-500 focus-within:border-brand-500';
  const inputCls = isDark ? 'text-[#e2e8f0] placeholder-[#4a6580]' : 'text-brand-800 placeholder-brand-300';
  const iconCls = isDark ? 'text-[#4d6d8a]' : 'text-brand-400';
  const dropCls = isDark ? 'bg-[#1e3350] border-[#2d4a68]' : 'bg-white border-brand-100';
  const emptyTxt = isDark ? 'text-[#4d6d8a]' : 'text-brand-400';
  const itemBase = isDark ? 'text-[#94a3b8] hover:bg-[#243b53]' : 'text-brand-700 hover:bg-brand-50';
  const itemActive = isDark ? 'text-[#e2e8f0] font-medium bg-[#243b53]' : 'text-brand-800 font-medium bg-brand-50';

  return (
    <div ref={ref} className={`relative ${width}`}>
      <div
        onClick={() => { setQuery(''); setOpen(true); }}
        className={`flex items-center border rounded-lg cursor-pointer focus-within:ring-1 transition-all shadow-sm ${triggerCls}`}
      >
        <Search className={`w-3.5 h-3.5 ml-2.5 shrink-0 ${iconCls}`} />
        <input
          className={`flex-1 px-2 py-2 bg-transparent text-sm focus:outline-none min-w-0 ${inputCls}`}
          placeholder={placeholder}
          value={open ? query : selectedLabel}
          onFocus={() => { setQuery(''); setOpen(true); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
        {value && !open && (
          <button
            onClick={e => { e.stopPropagation(); onChange(''); setQuery(''); }}
            className={`pr-1.5 shrink-0 ${isDark ? 'text-[#4d6d8a] hover:text-[#94a3b8]' : 'text-brand-300 hover:text-brand-600'}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronDown className={`w-3.5 h-3.5 mr-2 transition-transform shrink-0 ${open ? 'rotate-180' : ''} ${iconCls}`} />
      </div>
      {open && (
        <div className={`absolute top-full left-0 mt-1 z-50 border rounded-xl shadow-lg max-h-52 overflow-y-auto min-w-full ${dropCls}`}>
          {filtered.length === 0 ? (
            <div className={`px-4 py-3 text-sm text-center ${emptyTxt}`}>No matches</div>
          ) : filtered.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${value === opt.value ? itemActive : itemBase}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const CHECKING_VERIFY_STATUS_OPTIONS: Opt[] = [
  { label: 'Verified', value: 'verified' },
  { label: 'Hold', value: 'hold' },
  { label: 'Canceled', value: 'canceled' },
];

interface Props {
  search: string; onSearchChange: (v: string) => void;
  unitNo: string; onUnitNoChange: (v: string) => void;
  flsAgent: string; onFlsAgentChange: (v: string) => void;
  mgrAgent: string; onMgrAgentChange: (v: string) => void;
  avpAgent: string; onAvpAgentChange: (v: string) => void;
  customerName: string; onCustomerNameChange: (v: string) => void;
  dateFrom: string; onDateFromChange: (v: string) => void;
  dateTo: string; onDateToChange: (v: string) => void;
  onExport: () => void; exporting?: boolean;
  onAddNew?: () => void;
  theme?: 'blue' | 'green' | 'purple';
  checkingVerifyStatus?: string;
  onCheckingVerifyStatusChange?: (v: string) => void;
  extraFilters?: Record<string, string>;
  onExtraFiltersChange?: (f: Record<string, string>) => void;
  advStorageKey?: string;
}

export default function FlsFilter({
  search, onSearchChange,
  unitNo, onUnitNoChange,
  flsAgent, onFlsAgentChange,
  mgrAgent, onMgrAgentChange,
  avpAgent, onAvpAgentChange,
  customerName, onCustomerNameChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
  onExport, exporting = false,
  onAddNew,
  checkingVerifyStatus,
  onCheckingVerifyStatusChange,
  extraFilters = {},
  onExtraFiltersChange = () => { },
  advStorageKey = 'fls_adv_drawer',
}: Props) {
  const { isDark } = useFlsTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [dateOpen, setDateOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const [unitNoOptions, setUnitNoOptions] = useState<Opt[]>([]);
  const [flsAgentOptions, setFlsAgentOptions] = useState<Opt[]>([]);
  const [mgrAgentOptions, setMgrAgentOptions] = useState<Opt[]>([]);
  const [avpAgentOptions, setAvpAgentOptions] = useState<Opt[]>([]);
  const [customerOptions, setCustomerOptions] = useState<Opt[]>([]);

  const [pending, setPending] = useState({
    search, unitNo, flsAgent, mgrAgent, avpAgent, customerName,
    dateFrom, dateTo, checkingVerifyStatus: checkingVerifyStatus ?? '',
  });
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);

  const dateSelected = datePreset !== 'all';

  const hasAnyFilterValue = !!(
    pending.search ||
    pending.unitNo ||
    pending.flsAgent ||
    pending.mgrAgent ||
    pending.avpAgent ||
    pending.customerName ||
    pending.checkingVerifyStatus ||
    pending.dateFrom ||
    pending.dateTo ||
    Object.keys(extraFilters).length > 0
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePresetChange = (key: string) => {
    setDatePreset(key);
    setDateOpen(false);
    if (key === 'all') {
      setPending(p => ({ ...p, dateFrom: '', dateTo: '' }));
    } else if (key !== 'date_range') {
      const dr = computeDateRange(key);
      if (dr) setPending(p => ({ ...p, dateFrom: dr.from, dateTo: dr.to }));
    }
  };

  useEffect(() => {
    api.get('/fls-booking/options').then(res => {
      const d = res.data?.data || {};
      setUnitNoOptions((d.unit_nos || []).map((v: string) => ({ label: v, value: v })));
      setFlsAgentOptions((d.fls_agents || []).map((a: any) => ({
        label: a.fls_name ? `${a.fls_id} - ${a.fls_name}` : a.fls_id,
        value: a.fls_id || a.fls_name,
      })));
      setMgrAgentOptions((d.mgr_agents || []).map((a: any) => ({
        label: a.mgr_name ? `${a.mgr_id} - ${a.mgr_name}` : a.mgr_id,
        value: a.mgr_id || a.mgr_name,
      })));
      setAvpAgentOptions((d.avp_agents || []).map((a: any) => ({
        label: a.avp_name ? `${a.avp_id} - ${a.avp_name}` : a.avp_id,
        value: a.avp_id || a.avp_name,
      })));
      setCustomerOptions((d.customers || []).map((c: { name: string }) => ({
        label: c.name,
        value: c.name,
      })));
    }).catch(() => { });
  }, []);

  const handleApply = () => {
    onSearchChange(pending.search);
    onUnitNoChange(pending.unitNo);
    onFlsAgentChange(pending.flsAgent);
    onMgrAgentChange(pending.mgrAgent);
    onAvpAgentChange(pending.avpAgent);
    onCustomerNameChange(pending.customerName);
    onDateFromChange(pending.dateFrom);
    onDateToChange(pending.dateTo);
    onCheckingVerifyStatusChange?.(pending.checkingVerifyStatus);
    setHasAppliedFilters(true);
  };

  const handleReset = () => {
    setPending({ search: '', unitNo: '', flsAgent: '', mgrAgent: '', avpAgent: '', customerName: '', dateFrom: '', dateTo: '', checkingVerifyStatus: '' });
    setDatePreset('all');
    onSearchChange(''); onUnitNoChange(''); onFlsAgentChange('');
    onMgrAgentChange(''); onAvpAgentChange('');
    onCustomerNameChange(''); onDateFromChange(''); onDateToChange('');
    onCheckingVerifyStatusChange?.('');
    onExtraFiltersChange({});
    setHasAppliedFilters(false);
  };

  const dateBtnCls = isDark
    ? 'bg-[#1e3350] border-[#2d4a68] text-[#94a3b8] hover:bg-[#243b53]'
    : 'bg-white border-brand-200 text-brand-700 hover:bg-brand-50';
  const dateDropCls = isDark ? 'bg-[#1e3350] border-[#2d4a68]' : 'bg-white border-brand-100';
  const dateItemBase = isDark ? 'text-[#94a3b8] hover:bg-[#243b53]' : 'text-brand-700 hover:bg-brand-50';
  const dateItemActive = isDark ? 'text-[#e2e8f0] bg-[#243b53] font-medium' : 'text-brand-800 bg-brand-50 font-medium';
  const searchInputCls = isDark
    ? 'bg-[#1e3350] border-[#2d4a68] text-[#e2e8f0] placeholder-[#4a6580] focus:ring-[#3d6b9e] focus:border-[#3d6b9e]'
    : 'bg-white border-brand-200 text-brand-800 placeholder-brand-300 focus:ring-brand-500 focus:border-brand-500';

  return (
    <div className="bg-white rounded-xl border border-brand-100 shadow-sm p-4 mb-4 space-y-2">

      {/* ── Row 1: Search + primary selects (left) | Advanced, Export, Add Booking (right) ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-[#4d6d8a]' : 'text-brand-400'}`} />
            <input
              className={`pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 w-44 shadow-sm ${searchInputCls}`}
              placeholder="Search..."
              value={pending.search}
              onChange={e => setPending(p => ({ ...p, search: e.target.value }))}
            />
          </div>

          <SearchableSelect isDark={isDark} value={pending.unitNo} onChange={v => setPending(p => ({ ...p, unitNo: v }))}
            options={unitNoOptions} placeholder="Unit No" width="w-32" />
          <SearchableSelect isDark={isDark} value={pending.flsAgent} onChange={v => setPending(p => ({ ...p, flsAgent: v }))}
            options={flsAgentOptions} placeholder="FLS ID - Name" width="w-48" />
          <SearchableSelect isDark={isDark} value={pending.mgrAgent} onChange={v => setPending(p => ({ ...p, mgrAgent: v }))}
            options={mgrAgentOptions} placeholder="Manager ID - Name" width="w-48" />
          <SearchableSelect isDark={isDark} value={pending.avpAgent} onChange={v => setPending(p => ({ ...p, avpAgent: v }))}
            options={avpAgentOptions} placeholder="AVP ID - Name" width="w-48" />
        </div>

        {/* Right: Advanced, Export, Add Booking */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Advanced Filter */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`relative flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm
            ${Object.keys(extraFilters).length > 0
                ? (isDark ? 'bg-brand-900 border-brand-600 text-brand-200' : 'bg-brand-50 border-brand-400 text-brand-700')
                : (isDark ? 'bg-white/5 border-brand-700 text-brand-300 hover:bg-white/10' : 'bg-white border-brand-200 text-brand-700 hover:bg-brand-50')}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Advanced</span>
            {Object.keys(extraFilters).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                {Object.keys(extraFilters).length > 9 ? '9+' : Object.keys(extraFilters).length}
              </span>
            )}
          </button>

          {/* Export */}
          <button
            onClick={onExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-200 rounded-lg text-sm text-brand-700 hover:bg-brand-50 disabled:opacity-40 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>

          {/* Add Booking — booking page only */}
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Booking
            </button>
          )}
        </div>
      </div>

      {/* ── Row 2: Secondary selects + date (left) | Apply, Reset (right) ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
          <SearchableSelect isDark={isDark} value={pending.customerName} onChange={v => setPending(p => ({ ...p, customerName: v }))}
            options={customerOptions} placeholder="Customer Name" width="w-48" />

          {/* Checking Verify Status — only shown when prop is provided */}
          {onCheckingVerifyStatusChange !== undefined && (
            <SearchableSelect
              isDark={isDark}
              value={pending.checkingVerifyStatus}
              onChange={v => setPending(p => ({ ...p, checkingVerifyStatus: v }))}
              options={CHECKING_VERIFY_STATUS_OPTIONS}
              placeholder="Verify Status"
              width="w-36"
            />
          )}

          {/* Date preset dropdown */}
          <div className="relative" ref={dateRef}>
            <button
              type="button"
              onClick={() => setDateOpen(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm focus:outline-none whitespace-nowrap shadow-sm transition-colors ${dateSelected
                ? (isDark ? 'bg-brand-900 border-brand-600 text-brand-200 font-medium' : 'bg-brand-50 border-brand-400 text-brand-700 font-medium')
                : dateBtnCls
                }`}
            >
              <span className="shrink-0">📅</span>
              <span>{DATE_PRESETS.find(p => p.key === datePreset)?.label ?? 'All Time'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dateOpen ? 'rotate-180' : ''} ${isDark ? 'text-[#4d6d8a]' : 'text-brand-400'}`} />
            </button>
            {dateOpen && (
              <div className={`absolute top-full left-0 mt-1 z-50 border rounded-xl shadow-lg w-44 ${dateDropCls}`}>
                {DATE_PRESETS.map(p => (
                  <button key={p.key} type="button" onClick={() => handlePresetChange(p.key)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between first:rounded-t-xl last:rounded-b-xl transition-colors ${datePreset === p.key ? dateItemActive : dateItemBase}`}
                  >
                    {p.label}
                    {datePreset === p.key && <span className={`text-xs ${isDark ? 'text-[#60a5fa]' : 'text-brand-600'}`}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date range pickers (only when date_range preset chosen) */}
          {datePreset === 'date_range' && (
            <div className="flex items-center gap-1.5">
              <div className="w-36">
                <DarkDatePicker value={pending.dateFrom} onChange={v => setPending(p => ({ ...p, dateFrom: v }))} placeholder="From date" compact />
              </div>
              <span className={`text-sm ${isDark ? 'text-[#4d6d8a]' : 'text-brand-300'}`}>→</span>
              <div className="w-36">
                <DarkDatePicker value={pending.dateTo} onChange={v => setPending(p => ({ ...p, dateTo: v }))} placeholder="To date" compact />
              </div>
              <button type="button" onClick={() => handlePresetChange('all')}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-colors shrink-0" title="Clear">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Apply (when pending values exist) | Reset (only after filters applied) */}
        {(hasAnyFilterValue || hasAppliedFilters || Object.keys(extraFilters).length > 0) && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasAnyFilterValue && (
              <button
                onClick={handleApply}
                className="flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Filter className="w-3.5 h-3.5" /> Apply
              </button>
            )}
            {(hasAppliedFilters || Object.keys(extraFilters).length > 0) && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-200 rounded-lg text-sm text-brand-700 hover:bg-brand-50 transition-colors shadow-sm"
                title="Clear filters & refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filter Drawer */}
      <AdvancedFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApply={onExtraFiltersChange}
        activeFilters={extraFilters}
        storageKey={advStorageKey}
      />
    </div>
  );
}