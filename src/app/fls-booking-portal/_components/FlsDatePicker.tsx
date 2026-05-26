'use client';
import React, { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, isValid, parse } from 'date-fns';

interface Props {
  value: string; // YYYY-MM-DD or ''
  onChange: (val: string) => void;
  placeholder?: string;
}

const DAY_CLS = [
  'rdp-day_button w-8 h-8 rounded-lg text-sm font-medium transition-colors',
  'hover:bg-slate-100 text-slate-700',
  'aria-selected:bg-slate-800 aria-selected:text-white aria-selected:hover:bg-slate-700',
  'disabled:opacity-30 disabled:cursor-not-allowed',
].join(' ');

export default function FlsDatePicker({ value, onChange, placeholder = 'Pick a date' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const valid = selected && isValid(selected);
  const display = valid ? format(selected!, 'dd MMM yyyy') : '';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger input */}
      <div className="relative">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          readOnly
          className="pl-8 pr-7 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-sm cursor-pointer select-none"
          placeholder={placeholder}
          value={display}
          onClick={() => setOpen(o => !o)}
        />
        {value && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(''); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Calendar popup */}
      {open && (
        <div className="absolute z-50 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-3 min-w-[280px]">
          <DayPicker
            mode="single"
            selected={valid ? selected : undefined}
            onSelect={date => { onChange(date ? format(date, 'yyyy-MM-dd') : ''); setOpen(false); }}
            classNames={{
              root: 'text-sm',
              months: 'flex flex-col',
              month: 'space-y-2',
              month_caption: 'flex items-center justify-between px-1 py-1',
              caption_label: 'text-sm font-semibold text-slate-800',
              nav: 'flex items-center gap-1',
              button_previous: 'p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors',
              button_next: 'p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: 'w-9 h-8 flex items-center justify-center text-[10px] font-semibold text-slate-400 uppercase',
              week: 'flex',
              day: 'p-0.5',
              day_button: 'w-8 h-8 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 text-slate-700 focus:outline-none',
              selected: '[&>button]:bg-slate-800 [&>button]:text-white [&>button]:hover:bg-slate-700',
              today: '[&>button]:font-bold [&>button]:text-blue-600 [&>button]:ring-1 [&>button]:ring-blue-300',
              outside: '[&>button]:text-slate-300',
              disabled: '[&>button]:opacity-30 [&>button]:cursor-not-allowed',
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left'
                  ? <ChevronLeft className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />,
            }}
          />
        </div>
      )}
    </div>
  );
}
