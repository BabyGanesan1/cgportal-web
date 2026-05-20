'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, X, Download, Plus, Filter, RefreshCw } from 'lucide-react';
import api from '../../../lib/api';
import DarkDatePicker from './DarkDatePicker';

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
}

function SearchableSelect({ value, onChange, options, placeholder, width = 'w-36' }: SearchableSelectProps) {
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

  return (
    <div ref={ref} className={`relative ${width}`}>
      <div
        onClick={() => { setQuery(''); setOpen(true); }}
        className="flex items-center bg-white border border-brand-200 rounded-lg cursor-pointer focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all shadow-sm"
      >
        <Search className="w-3.5 h-3.5 text-brand-400 ml-2.5 shrink-0" />
        <input
          className="flex-1 px-2 py-2 bg-transparent text-brand-800 placeholder-brand-300 text-sm focus:outline-none min-w-0"
          placeholder={placeholder}
          value={open ? query : selectedLabel}
          onFocus={() => { setQuery(''); setOpen(true); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
        {value && !open && (
          <button onClick={e => { e.stopPropagation(); onChange(''); setQuery(''); }}
            className="pr-1.5 text-brand-300 hover:text-brand-600 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-brand-400 mr-2 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-brand-100 rounded-xl shadow-lg max-h-52 overflow-y-auto min-w-full">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-brand-400 text-center">No matches</div>
          ) : filtered.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                value === opt.value ? 'text-brand-800 font-medium bg-brand-50' : 'text-brand-700 hover:bg-brand-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  search: string; onSearchChange: (v: string) => void;
  unitNo: string; onUnitNoChange: (v: string) => void;
  flsAgent: string; onFlsAgentChange: (v: string) => void;
  customerName: string; onCustomerNameChange: (v: string) => void;
  dateFrom: string; onDateFromChange: (v: string) => void;
  dateTo: string; onDateToChange: (v: string) => void;
  onExport: () => void; exporting?: boolean;
  onAddNew?: () => void;
  theme?: 'blue' | 'green' | 'purple';
}

export default function FlsFilter({
  search, onSearchChange,
  unitNo, onUnitNoChange,
  flsAgent, onFlsAgentChange,
  customerName, onCustomerNameChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
  onExport, exporting = false,
  onAddNew,
}: Props) {
  const [datePreset, setDatePreset] = useState('all');
  const [dateOpen, setDateOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const [unitNoOptions, setUnitNoOptions] = useState<Opt[]>([]);
  const [flsAgentOptions, setFlsAgentOptions] = useState<Opt[]>([]);
  const [customerOptions, setCustomerOptions] = useState<Opt[]>([]);

  const [pending, setPending] = useState({ search, unitNo, flsAgent, customerName, dateFrom, dateTo });

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
      setCustomerOptions((d.customers || []).map((c: { name: string; mail: string }) => ({
        label: c.mail ? `${c.name} - ${c.mail}` : c.name,
        value: c.name,
      })));
    }).catch(() => {});
  }, []);

  const handleApply = () => {
    onSearchChange(pending.search);
    onUnitNoChange(pending.unitNo);
    onFlsAgentChange(pending.flsAgent);
    onCustomerNameChange(pending.customerName);
    onDateFromChange(pending.dateFrom);
    onDateToChange(pending.dateTo);
  };

  const handleReset = () => {
    setPending({ search: '', unitNo: '', flsAgent: '', customerName: '', dateFrom: '', dateTo: '' });
    setDatePreset('all');
    onSearchChange('');
    onUnitNoChange('');
    onFlsAgentChange('');
    onCustomerNameChange('');
    onDateFromChange('');
    onDateToChange('');
  };

  return (
    <div className="bg-white rounded-xl border border-brand-100 shadow-sm p-4 mb-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center flex-1">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400" />
            <input
              className="pl-8 pr-3 py-2 bg-white border border-brand-200 rounded-lg text-sm text-brand-800 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 w-44 shadow-sm"
              placeholder="Search..."
              value={pending.search}
              onChange={e => setPending(p => ({ ...p, search: e.target.value }))}
            />
          </div>

          <SearchableSelect value={pending.unitNo} onChange={v => setPending(p => ({ ...p, unitNo: v }))}
            options={unitNoOptions} placeholder="Unit No" width="w-32" />

          <SearchableSelect value={pending.flsAgent} onChange={v => setPending(p => ({ ...p, flsAgent: v }))}
            options={flsAgentOptions} placeholder="FLS Agent" width="w-52" />

          <SearchableSelect value={pending.customerName} onChange={v => setPending(p => ({ ...p, customerName: v }))}
            options={customerOptions} placeholder="Customer" width="w-52" />

          {/* Date preset */}
          <div className="relative" ref={dateRef}>
            <button type="button" onClick={() => setDateOpen(v => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-brand-200 rounded-lg text-sm text-brand-700 hover:bg-brand-50 transition-colors focus:outline-none whitespace-nowrap shadow-sm">
              <span className="shrink-0">📅</span>
              <span>{DATE_PRESETS.find(p => p.key === datePreset)?.label ?? 'All Time'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-brand-400 transition-transform ${dateOpen ? 'rotate-180' : ''}`} />
            </button>
            {dateOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-brand-100 rounded-xl shadow-lg w-44">
                {DATE_PRESETS.map(p => (
                  <button key={p.key} type="button" onClick={() => handlePresetChange(p.key)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between first:rounded-t-xl last:rounded-b-xl transition-colors ${
                      datePreset === p.key
                        ? 'text-brand-800 bg-brand-50 font-medium'
                        : 'text-brand-700 hover:bg-brand-50'
                    }`}
                  >
                    {p.label}
                    {datePreset === p.key && <span className="text-xs text-brand-600">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date range pickers */}
          {datePreset === 'date_range' && (
            <div className="flex items-center gap-1.5">
              <div className="w-36">
                <DarkDatePicker value={pending.dateFrom} onChange={v => setPending(p => ({ ...p, dateFrom: v }))} placeholder="From date" compact />
              </div>
              <span className="text-brand-300 text-sm">→</span>
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

        {/* Right: Apply + Export + Add New */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleApply}
            className="flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Filter className="w-3.5 h-3.5" />
            Apply
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-200 rounded-lg text-sm text-brand-700 hover:bg-brand-50 transition-colors shadow-sm"
            title="Clear filters & refresh">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button onClick={onExport} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-200 rounded-lg text-sm text-brand-700 hover:bg-brand-50 disabled:opacity-40 transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
          {onAddNew && (
            <button onClick={onAddNew}
              className="flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
