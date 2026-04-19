'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
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
        <input
          ref={ref}
          id={inputId}
          className={cn('input-field', error && 'error', className)}
          {...props}
        />
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
