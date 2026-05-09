'use client';
import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: Option[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  error?: string;
}

export default function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  error,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optValue: string | number) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const removeValue = (e: React.MouseEvent, optValue: string | number) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optValue));
  };

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <div className="w-full" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-brand-700 mb-1">{label}</label>}
      
      <div
        className={`relative min-h-[42px] w-full border rounded-lg px-2 py-1.5 flex flex-wrap gap-1.5 cursor-pointer bg-white focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent ${
          error ? 'border-red-400' : 'border-brand-200'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-xs font-medium border border-brand-100"
            >
              {opt.label}
              <button
                type="button"
                onClick={(e) => removeValue(e, opt.value)}
                className="hover:text-red-500 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-brand-300 text-sm ml-1 select-none">{placeholder}</span>
        )}
        
        <div className="ml-auto pr-1 flex items-center">
          <ChevronDown className={`w-4 h-4 text-brand-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-100 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto animate-fade-in py-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-brand-400 text-center">No options available</div>
            ) : (
              options.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(opt.value);
                    }}
                    className={`px-3 py-2 text-sm flex items-center justify-between hover:bg-brand-50 transition-colors ${
                      isSelected ? 'text-brand-700 font-medium bg-brand-50/50' : 'text-brand-600'
                    }`}
                  >
                    {opt.label}
                    {isSelected && <Check className="w-4 h-4 text-brand-500" />}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
