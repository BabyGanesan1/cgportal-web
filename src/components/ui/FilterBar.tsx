'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  onClearAll?: () => void;
  resultCount?: { showing: number; total: number };
  className?: string;
}

export default function FilterBar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  onClearAll,
  resultCount,
  className = ''
}: FilterBarProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasFilters = filters.some(f => f.value) || search;

  return (
    <div ref={ref} className={`bg-white rounded-xl p-4 shadow-sm border border-brand-100 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        {onSearchChange && (
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <div key={filter.label} className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === filter.label ? null : filter.label)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  filter.value
                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                    : 'border-brand-200 text-brand-600 hover:border-brand-300'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{filter.value ? filter.options.find(o => o.value === filter.value)?.label : filter.label}</span>
                {filter.value && (
                  <X
                    className="w-3 h-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      filter.onChange('');
                    }}
                  />
                )}
                {!filter.value && <ChevronDown className="w-3 h-3" />}
              </button>

              {openFilter === filter.label && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-brand-200 z-20 py-1 animate-fade-in">
                  <button
                    onClick={() => {
                      filter.onChange('');
                      setOpenFilter(null);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 ${
                      !filter.value ? 'text-brand-600 font-medium' : 'text-brand-500'
                    }`}
                  >
                    All
                  </button>
                  {filter.options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        filter.onChange(opt.value);
                        setOpenFilter(null);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 ${
                        filter.value === opt.value ? 'text-brand-600 font-medium' : 'text-brand-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {hasFilters && onClearAll && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {resultCount && (
        <div className="text-sm text-brand-500 mt-3">
          Showing{' '}
          <span className="font-semibold text-brand-700">{resultCount.showing}</span> of{' '}
          <span className="font-semibold text-brand-700">{resultCount.total}</span> results
        </div>
      )}
    </div>
  );
}