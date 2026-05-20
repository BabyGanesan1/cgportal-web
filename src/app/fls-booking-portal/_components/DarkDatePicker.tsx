'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO,
} from 'date-fns';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  accent?: 'blue' | 'green' | 'purple';
  compact?: boolean;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DarkDatePicker({ value, onChange, placeholder = 'Select date', compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => value ? parseISO(value) : new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (value) { try { setMonth(parseISO(value)); } catch {} }
  }, [value]);

  const pick = (d: Date) => { onChange(format(d, 'yyyy-MM-dd')); setOpen(false); };
  const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChange(''); };

  const renderCells = () => {
    const start = startOfWeek(startOfMonth(month));
    const end   = endOfWeek(endOfMonth(month));
    const rows: React.ReactNode[] = [];
    let days: React.ReactNode[] = [];
    let day = start;
    while (day <= end) {
      for (let i = 0; i < 7; i++) {
        const clone = day;
        const inMonth = isSameMonth(clone, month);
        const selected = value ? isSameDay(clone, parseISO(value)) : false;
        const isToday  = isSameDay(clone, new Date());
        days.push(
          <button key={clone.toString()} type="button"
            onClick={() => pick(clone)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
              ${selected
                ? 'bg-brand-800 text-white'
                : isToday
                  ? 'border border-brand-500 text-brand-700 bg-transparent'
                  : inMonth
                    ? 'text-brand-700 hover:bg-brand-50'
                    : 'text-brand-300 hover:bg-brand-50'}
            `}
          >
            {format(clone, 'd')}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(<div key={day.toString()} className="grid grid-cols-7 gap-0.5">{days}</div>);
      days = [];
    }
    return rows;
  };

  const displayVal = value ? (() => { try { return format(parseISO(value), 'dd MMM yyyy'); } catch { return ''; } })() : '';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 bg-white border border-brand-200 rounded-lg transition-colors hover:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500
          ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'} w-full`}
      >
        <Calendar className={`shrink-0 text-brand-400 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
        <span className={`flex-1 text-left ${compact ? 'text-xs' : 'text-sm'} ${displayVal ? 'text-brand-800' : 'text-brand-300'} truncate`}>
          {displayVal || placeholder}
        </span>
        {displayVal && (
          <span onClick={clear} className="text-brand-300 hover:text-brand-600 transition-colors shrink-0">
            <X className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-[100] bg-white border border-brand-100 rounded-xl shadow-lg w-64 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-brand-100">
            <button type="button" onClick={() => setMonth(subMonths(month, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-50 text-brand-500 hover:text-brand-800 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-brand-800">{format(month, 'MMMM yyyy')}</span>
            <button type="button" onClick={() => setMonth(addMonths(month, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-50 text-brand-500 hover:text-brand-800 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2.5">
            {/* Day labels */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAYS.map(d => (
                <div key={d} className="w-8 h-6 flex items-center justify-center text-[10px] font-bold text-brand-400 uppercase tracking-wider">{d}</div>
              ))}
            </div>
            {/* Cells */}
            <div className="space-y-0.5">{renderCells()}</div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-brand-100 bg-brand-50">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className="text-xs text-brand-500 hover:text-brand-700 transition-colors">
              Clear
            </button>
            <button type="button" onClick={() => pick(new Date())}
              className="text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors">
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
