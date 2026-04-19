'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open)  dialogRef.current?.showModal();
    else       dialogRef.current?.close();
  }, [open]);

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }[size];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        'w-full rounded-xl border border-[var(--border)] p-0 shadow-xl',
        'backdrop:bg-black/50 backdrop:backdrop-blur-sm',
        sizeClass
      )}
      style={{ margin: 'auto' }}
    >
      {open && (
        <div className="animate-fade-in">
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>
      )}
    </dialog>
  );
}
