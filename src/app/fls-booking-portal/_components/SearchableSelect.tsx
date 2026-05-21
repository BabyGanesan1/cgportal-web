'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export interface SelectOpt { label: string; value: string }

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: SelectOpt[];
  placeholder: string;
  width?: string;
  isDark?: boolean;
  className?: string;
  disabled?: boolean;
  hasError?: boolean;
}

export default function SearchableSelect({
  value, onChange, options, placeholder,
  width, isDark = false, className = '', disabled = false, hasError = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;
  const selectedLabel = options.find(o => o.value === value)?.label ?? '';

  const borderCol = hasError
    ? (isDark ? 'border-red-500' : 'border-red-400')
    : (isDark ? 'border-[#1e3a55]' : 'border-brand-200');

  const disabledWrapper = isDark
    ? 'bg-[#0a1827] border-[#142233] cursor-not-allowed opacity-60'
    : 'bg-brand-50 border-brand-100 cursor-not-allowed opacity-60';

  const inputCls = isDark ? 'text-slate-200 placeholder-slate-500' : 'text-brand-800 placeholder-brand-300';
  const iconCls = isDark ? 'text-slate-500' : 'text-brand-400';
  const clearCls = isDark ? 'text-slate-500 hover:text-slate-200' : 'text-brand-300 hover:text-brand-600';
  const bgCls = isDark ? 'bg-[#0d1f33]' : 'bg-white';
  const dividerCls = isDark ? 'border-[#1e3a55]' : 'border-brand-200';
  const emptyTxt = isDark ? 'text-slate-500' : 'text-brand-400';
  const itemBase = isDark
    ? 'text-slate-300 hover:bg-[#162d46] hover:text-white'
    : 'text-brand-700 hover:bg-brand-50 hover:text-brand-900';
  const itemSel = isDark
    ? 'text-white font-medium bg-[#1a3450]'
    : 'text-brand-900 font-medium bg-brand-50';

  const wrapperCls = disabled
    ? `border rounded-lg transition-all ${disabledWrapper}`
    : `border transition-all ${bgCls} ${borderCol} ${open ? 'rounded-t-lg' : 'rounded-lg'}`;

  return (
    <div ref={ref} className={`relative ${width ?? 'w-full'} ${className}`}>
      <style>{`.fls-search-input:focus { outline: none !important; box-shadow: none !important; } .fls-search-input:focus-visible { outline: none !important; box-shadow: none !important; }`}</style>
      <div className={wrapperCls}>
        {/* Trigger row — clicking anywhere opens dropdown */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => {
            if (!disabled) {
              setQuery('');
              setOpen(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }}
        >
          <Search className={`w-3.5 h-3.5 ml-2.5 shrink-0 ${iconCls}`} />
          <input
            ref={inputRef}
            className={`fls-search-input flex-1 px-2 py-2 bg-transparent text-sm outline-none border-none ring-0 min-w-0 ${inputCls} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ boxShadow: 'none', WebkitAppearance: 'none', outline: 'none', outlineOffset: '0' }}
            placeholder={placeholder}
            value={open ? query : selectedLabel}
            disabled={disabled}
            readOnly={!open}
            onChange={e => { setQuery(e.target.value); }}
          />
          {value && !open && !disabled && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(''); setQuery(''); }}
              className={`pr-1 shrink-0 ${clearCls}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-3.5 h-3.5 mr-2 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${iconCls}`} />
        </div>

        {/* Dropdown list — inside same bordered wrapper */}
        {open && !disabled && (
          <>
            <div className={`border-t ${dividerCls}`} />
            <div className="max-h-56 overflow-y-auto rounded-b-lg">
              {filtered.length === 0 ? (
                <div className={`px-4 py-3 text-sm text-center ${emptyTxt}`}>No matches</div>
              ) : (
                filtered.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors last:rounded-b-lg ${value === opt.value ? itemSel : itemBase}`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}