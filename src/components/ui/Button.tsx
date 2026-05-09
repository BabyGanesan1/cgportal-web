import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary: 'bg-brand-800 hover:bg-brand-900 text-white',
  secondary: 'bg-white hover:bg-brand-50 text-brand-800 border border-brand-200',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-transparent hover:bg-brand-100 text-brand-700',
  gold: 'bg-yellow-500 hover:bg-yellow-600 text-white',
};
const sizes = { sm: 'px-3 py-1.5 text-xs rounded-md', md: 'px-4 py-2 text-sm rounded-lg', lg: 'px-6 py-3 text-base rounded-lg' };

export default function Button({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button {...props} disabled={disabled || loading}
      className={`inline-flex items-center gap-2 font-medium transition-all duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
