import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-brand-700 mb-1">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400">{icon}</div>}
          <input
            {...props}
            type={inputType}
            ref={ref}
            className={`w-full border rounded-lg px-3 py-2 text-sm text-brand-800 placeholder-brand-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
              icon ? 'pl-10' : ''
            } ${isPassword ? 'pr-10' : ''} ${error ? 'border-red-400' : 'border-brand-200'} ${className}`}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
