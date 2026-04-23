'use client';

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const isPassword = type === 'password';
    
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label 
            htmlFor={inputId} 
            className="text-[11px] font-bold uppercase tracking-[0.05rem] text-on-surface-variant ml-1 opacity-70"
          >
            {label}
          </label>
        )}
        <div className="relative group/input">
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={cn(
              'input-field', 
              isPassword && 'pr-12',
              error && 'error', 
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline/40 hover:text-primary transition-colors focus:outline-none"
              tabIndex={-1}
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          )}
        </div>
        {error && <p className="text-[10px] font-bold text-error mt-0.5 ml-1">{error}</p>}
        {hint  && !error && <p className="text-[10px] font-bold text-on-surface-variant opacity-50 mt-0.5 ml-1">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label 
            htmlFor={inputId} 
            className="text-[11px] font-bold uppercase tracking-[0.05rem] text-on-surface-variant ml-1 opacity-70"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn('input-field', error && 'error', className)}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-[10px] font-bold text-error mt-0.5 ml-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label 
            htmlFor={inputId} 
            className="text-[11px] font-bold uppercase tracking-[0.05rem] text-on-surface-variant ml-1 opacity-70"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={cn('input-field resize-none', error && 'error', className)}
          {...props}
        />
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
