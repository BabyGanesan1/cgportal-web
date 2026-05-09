'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    parseISO
} from 'date-fns';

interface DatePickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
}

export default function DatePicker({ value, onChange, label, placeholder = 'Select date', className = '' }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value ? parseISO(value) : new Date());
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

    const onDateClick = (day: Date) => {
        onChange(format(day, 'yyyy-MM-dd'));
        setIsOpen(false);
    };

    const renderHeader = () => (
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-50">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-brand-50 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4 text-brand-500" />
            </button>
            <span className="text-sm font-bold text-brand-800">
                {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-brand-50 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-brand-500" />
            </button>
        </div>
    );

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 mb-2 px-2">
                {days.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-brand-400 uppercase tracking-widest py-2">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
                const cloneDay = day;
                const isSelected = value && isSameDay(day, parseISO(value));
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());

                days.push(
                    <div
                        key={day.toString()}
                        className={`relative h-9 flex items-center justify-center text-sm cursor-pointer transition-all rounded-lg m-0.5
              ${!isCurrentMonth ? "text-brand-200" : "text-brand-800"}
              ${isSelected ? "bg-brand-600 text-white font-bold shadow-md" : "hover:bg-brand-50"}
              ${isToday && !isSelected ? "text-brand-600 font-bold border border-brand-200" : ""}
            `}
                        onClick={() => onDateClick(cloneDay)}
                    >
                        <span className="z-10">{formattedDate}</span>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="px-2 pb-4">{rows}</div>;
    };

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            {label && <label className="block text-sm font-medium text-brand-700 mb-1">{label}</label>}
            <div className="relative group">
                <CalendarIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400 group-focus-within:text-brand-600 transition-colors pointer-events-none" />
                <input
                    type="text"
                    readOnly
                    value={value ? format(parseISO(value), 'dd MMM yyyy') : ''}
                    placeholder={placeholder}
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full pl-10 pr-10 py-2 border border-brand-200 rounded-lg text-sm text-brand-800 placeholder-brand-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all cursor-pointer"
                />
                {value && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange(''); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-brand-100 text-brand-400 hover:text-brand-600 transition-all"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-brand-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}
                    <div className="p-3 bg-brand-50/50 border-t border-brand-50 flex justify-between">
                        <button
                            onClick={() => { setCurrentMonth(new Date()); onDateClick(new Date()); }}
                            className="text-[11px] font-bold text-brand-600 hover:text-brand-800 transition-colors uppercase tracking-widest"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-[11px] font-bold text-brand-400 hover:text-brand-600 transition-colors uppercase tracking-widest"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
