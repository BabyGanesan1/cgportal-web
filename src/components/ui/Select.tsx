import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  onChange?: (e: any) => void;
}

export default function Select({ label, error, options, placeholder = 'Select...', className = '', onChange, value, name, disabled, ...props }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
      if (!isOpen) setSearch('');
  }, [isOpen]);

  const filteredOptions = options.filter(opt => 
    String(opt.label || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  const handleSelect = (val: string | number) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      const e = {
        target: { name, value: String(val) },
        currentTarget: { name, value: String(val) }
      };
      onChange(e);
    }
  };

  return (
    <div className={`w-full ${className}`} ref={wrapperRef}>
      {label && <label className="block text-sm font-medium text-brand-700 mb-1">{label}</label>}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ${
            disabled ? 'bg-gray-50 cursor-not-allowed text-brand-400' : 'cursor-pointer'
          } ${error ? 'border-red-400' : 'border-brand-200'} ${
            value ? 'text-brand-800' : 'text-brand-300'
          }`}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : (value ? value : placeholder)}</span>
          <ChevronDown
            size={16}
            className={`flex-shrink-0 text-brand-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
           <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-50 overflow-hidden bg-white border border-brand-200">
            <div className="p-2 border-b border-brand-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  type="text"
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-brand-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {value && (
                <button type="button" onClick={() => handleSelect('')}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-red-500 hover:bg-red-50 transition-colors">
                  <X className="w-4 h-4" /> Clear
                </button>
              )}
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-sm text-center text-brand-300">No matching options found.</div>
              ) : (
                filteredOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      String(value) === String(opt.value)
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-brand-800 hover:bg-brand-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
