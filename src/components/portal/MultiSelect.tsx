import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}

export default function MultiSelect({ options, value, onChange, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option];
    onChange(newValue);
  };

  const displayValue = value.length === 0 
    ? placeholder 
    : value.length === 1 
      ? value[0] 
      : `${value.length} selected`;

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-brand-50/50 border border-brand-100 rounded-2xl text-brand-800 text-sm font-semibold transition-all focus:ring-4 focus:ring-brand-200 outline-none"
      >
        <span className="truncate pr-2">{displayValue}</span>
        <ChevronDown className="w-4 h-4 text-brand-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 w-full bg-white border border-brand-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-2 animate-fade-in">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-brand-400 font-medium">No options</div>
          ) : (
            options.map((option, idx) => {
              const isSelected = value.includes(option);
              return (
                <div
                  key={idx}
                  onClick={() => toggleOption(option)}
                  className="flex items-center px-4 py-2.5 hover:bg-brand-50 cursor-pointer transition-colors"
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 flex-shrink-0 transition-colors ${isSelected ? 'bg-brand-900 border-brand-900 text-yellow-500' : 'border-brand-200 bg-white'}`}>
                    {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-brand-900' : 'text-brand-700'}`}>{option}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
