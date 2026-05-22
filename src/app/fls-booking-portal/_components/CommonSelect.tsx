'use client';

import React from 'react';
import Select, { StylesConfig } from 'react-select';
import { useFlsTheme } from './FlsThemeContext';

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
    /** @deprecated — theme is now read from FlsThemeContext automatically. Passing isDark still works as an override. */
    isDark?: boolean;
    hasError?: boolean;
    className?: string;
}

const customSelectStyles = (
    disabled = false,
    isDark = false,
    hasError = false
): StylesConfig<Option, false> => ({
    control: (base) => ({
        ...base,
        minHeight: '42px',
        borderRadius: '0.75rem',
        transition: 'border-color 0.2s ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: 'none',               // remove ALL focus rings / glow

        backgroundColor: disabled
            ? isDark ? '#0a1827' : '#f8fafc'
            : isDark ? '#0d1f33' : '#ffffff',

        // single border color — no change on hover or focus
        borderColor: hasError
            ? isDark ? '#ef4444' : '#f87171'
            : isDark ? '#1e3a55' : '#cbd5e1',

        '&:hover': {
            borderColor: hasError
                ? isDark ? '#ef4444' : '#f87171'
                : isDark ? '#1e3a55' : '#cbd5e1',  // same — no blue on hover
        },
    }),

    valueContainer: (base) => ({
        ...base,
        padding: '0 8px 0 12px',
        overflow: 'visible',
        flexWrap: 'nowrap',
    }),

    input: (base) => ({
        ...base,
        color: isDark ? '#e2e8f0' : '#1e293b',
        fontSize: '14px',
        margin: 0,
        padding: 0,
    }),

    placeholder: (base) => ({
        ...base,
        color: isDark ? '#64748b' : '#94a3b8',
        fontSize: '14px',
        marginLeft: 0,
        marginRight: 0,
    }),

    singleValue: (base) => ({
        ...base,
        color: isDark ? '#f8fafc' : '#1e293b',
        fontSize: '14px',
        fontWeight: 500,
        marginLeft: 0,
        marginRight: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        position: 'relative',   // override react-select's absolute positioning that clips text
        transform: 'none',
        top: 'auto',
    }),

    menu: (base) => ({
        ...base,
        zIndex: 9999,
        borderRadius: '0.75rem',
        overflow: 'hidden',
        backgroundColor: isDark ? '#10243a' : '#ffffff',
        border: isDark ? '1px solid #1e3a55' : '1px solid #e2e8f0',
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
        transition: 'background-color 0.15s ease',
        backgroundColor: state.isSelected
            ? isDark ? '#1a3450' : '#0f172a'
            : state.isFocused
                ? isDark ? '#162d46' : '#f1f5f9'
                : isDark ? '#10243a' : '#ffffff',
        color: state.isSelected
            ? '#ffffff'
            : isDark ? '#cbd5e1' : '#1e293b',
    }),

    dropdownIndicator: (base) => ({
        ...base,
        color: isDark ? '#64748b' : '#94a3b8',
        padding: '0 8px',
        transition: 'none',
        '&:hover': {
            color: isDark ? '#64748b' : '#94a3b8',  // no color change on hover
        },
    }),

    indicatorSeparator: () => ({
        display: 'none',
    }),

    clearIndicator: (base) => ({
        ...base,
        color: isDark ? '#64748b' : '#94a3b8',
        '&:hover': { color: '#ef4444' },
    }),

    menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
    }),
});

export default function CommonSelect({
    label,
    options,
    value,
    onChange,
    placeholder = 'Select',
    disabled = false,
    isDark: isDarkProp,
    hasError = false,
    className = '',
}: Props) {
    const { isDark: isDarkCtx } = useFlsTheme();
    const isDark = isDarkProp !== undefined ? isDarkProp : isDarkCtx;

    return (
        <div className={className}>
            {label && (
                <label
                    className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-brand-700'
                        }`}
                >
                    {label}
                </label>
            )}

            <Select
                options={options}
                value={options.find((o) => o.value === value) || null}
                onChange={(selected) => onChange(selected?.value || '')}
                placeholder={placeholder}
                isDisabled={disabled}
                isSearchable
                menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                classNamePrefix="react-select"
                styles={customSelectStyles(disabled, isDark, hasError)}
                theme={(theme) => ({
                    ...theme,
                    borderRadius: 12,
                    colors: {
                        ...theme.colors,
                        // override react-select's internal primary color so it doesn't bleed into focus rings
                        primary: isDark ? '#1e3a55' : '#cbd5e1',
                        primary25: isDark ? '#162d46' : '#f1f5f9',
                        primary50: isDark ? '#162d46' : '#f1f5f9',
                        primary75: isDark ? '#162d46' : '#f1f5f9',
                    },
                })}
            />
        </div>
    );
}