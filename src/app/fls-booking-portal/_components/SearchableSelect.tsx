'use client';

import React from 'react';
import Select, { StylesConfig } from 'react-select';

interface Option {
  label: string;
  value: string;
}

interface Props {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isDark?: boolean;
  hasError?: boolean;
  className?: string;
}

const customSelectStyles = (
  disabled = false,
  isDark = false,
  hasError = false
): StylesConfig<Option, false> => ({
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    borderRadius: '0.75rem',
    transition: 'all 0.2s ease',
    cursor: disabled ? 'not-allowed' : 'pointer',

    backgroundColor: disabled
      ? isDark
        ? '#0a1827'
        : '#f8fafc'
      : isDark
        ? '#0d1f33'
        : '#ffffff',

    borderColor: hasError
      ? isDark
        ? '#ef4444'
        : '#f87171'
      : state.isFocused
        ? isDark
          ? '#3b82f6'
          : '#64748b'
        : isDark
          ? '#1e3a55'
          : '#cbd5e1',

    boxShadow: state.isFocused
      ? isDark
        ? '0 0 0 1px #3b82f6'
        : '0 0 0 1px #64748b'
      : 'none',

    '&:hover': {
      borderColor: isDark ? '#3b82f6' : '#64748b',
    },
  }),

  valueContainer: (base) => ({
    ...base,
    padding: '0 12px',
  }),

  input: (base) => ({
    ...base,
    color: isDark ? '#e2e8f0' : '#1e293b',
    fontSize: '14px',
  }),

  placeholder: (base) => ({
    ...base,
    color: isDark ? '#64748b' : '#94a3b8',
    fontSize: '14px',
  }),

  singleValue: (base) => ({
    ...base,
    color: isDark ? '#f8fafc' : '#1e293b',
    fontSize: '14px',
    fontWeight: 500,
  }),

  menu: (base) => ({
    ...base,
    zIndex: 9999,
    borderRadius: '0.75rem',
    overflow: 'hidden',

    backgroundColor: isDark ? '#10243a' : '#ffffff',

    border: isDark
      ? '1px solid #1e3a55'
      : '1px solid #e2e8f0',

    boxShadow: isDark
      ? '0 10px 25px rgba(0,0,0,0.35)'
      : '0 10px 25px rgba(0,0,0,0.08)',
  }),

  menuList: (base) => ({
    ...base,
    padding: '6px',
    backgroundColor: isDark ? '#10243a' : '#ffffff',
  }),

  option: (base, state) => ({
    ...base,
    borderRadius: '0.5rem',
    marginBottom: '2px',
    padding: '10px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',

    backgroundColor: state.isSelected
      ? isDark
        ? '#1a3450'
        : '#0f172a'
      : state.isFocused
        ? isDark
          ? '#162d46'
          : '#f1f5f9'
        : isDark
          ? '#10243a'
          : '#ffffff',

    color: state.isSelected
      ? '#ffffff'
      : isDark
        ? '#cbd5e1'
        : '#1e293b',
  }),

  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused
      ? isDark
        ? '#60a5fa'
        : '#64748b'
      : isDark
        ? '#64748b'
        : '#94a3b8',

    transition: 'all 0.2s ease',
  }),

  indicatorSeparator: () => ({
    display: 'none',
  }),

  clearIndicator: (base) => ({
    ...base,
    color: isDark ? '#64748b' : '#94a3b8',

    '&:hover': {
      color: '#ef4444',
    },
  }),
});

export default function CommonSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select',
  disabled = false,
  isDark = false,
  hasError = false,
  className = '',
}: Props) {
  return (
    <div className={className}>
      {label && (
        <label
          className={`block text-xs font-medium mb-1 ${isDark
              ? 'text-slate-300'
              : 'text-brand-700'
            }`}
        >
          {label}
        </label>
      )}

      <Select
        options={options}
        value={
          options.find(
            (option) => option.value === value
          ) || null
        }
        onChange={(selected) =>
          onChange(selected?.value || '')
        }
        placeholder={placeholder}
        isDisabled={disabled}
        isSearchable
        classNamePrefix="react-select"
        styles={customSelectStyles(
          disabled,
          isDark,
          hasError
        )}
        theme={(theme) => ({
          ...theme,
          borderRadius: 12,
          colors: {
            ...theme.colors,
            primary: isDark
              ? '#3b82f6'
              : '#64748b',

            primary25: isDark
              ? '#162d46'
              : '#f1f5f9',
          },
        })}
      />
    </div>
  );
}