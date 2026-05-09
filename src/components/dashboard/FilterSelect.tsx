import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[] | { id: string | number, name: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ 
  label, value, options, onChange, placeholder = 'All', className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setSearchTerm('');
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const getLabel = () => {
    if (!value) return placeholder;
    const option = options.find(opt => {
      if (typeof opt === 'string') return opt === value;
      return String(opt.id) === value || opt.name === value;
    });
    if (!option) return value;
    return typeof option === 'string' ? option : option.name;
  };

  const filteredOptions = options.filter(opt => {
    const label = typeof opt === 'string' ? opt : opt.name;
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={dropdownRef}>
      <label className="text-[10px] sm:text-xs font-bold text-brand-500 uppercase tracking-wider px-1">
        {label}
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
            value 
              ? 'border-brand-200 bg-brand-50/30 text-brand-900 shadow-sm' 
              : 'border-brand-100 bg-white text-brand-400 hover:border-brand-200'
          }`}
        >
          <span className="truncate">{getLabel()}</span>
          <ChevronDown className={`w-4 h-4 text-brand-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-brand-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col">
            <div className="p-2.5 bg-brand-50/30 border-b border-brand-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-brand-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-400 bg-white placeholder:text-brand-300 transition-all"
                />
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto py-1.5 custom-scrollbar">
              <button
                onClick={() => { onChange(''); setIsOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 text-brand-400 transition-colors flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-200" />
                {placeholder}
              </button>
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-sm text-brand-400 text-center flex flex-col items-center gap-2">
                  <Search className="w-8 h-8 opacity-20" />
                  No results found
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const optVal = typeof opt === 'string' ? opt : String(opt.id);
                  const optLabel = typeof opt === 'string' ? opt : opt.name;
                  const isSelected = value === optVal;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => { onChange(optVal); setIsOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center gap-2 ${
                        isSelected 
                          ? 'bg-brand-50 text-brand-700 font-bold border-l-4 border-brand-500 pl-3' 
                          : 'hover:bg-brand-50 text-brand-600 border-l-4 border-transparent pl-3'
                      }`}
                    >
                      {optLabel}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSelect;
