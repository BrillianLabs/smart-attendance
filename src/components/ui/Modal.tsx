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
        'w-full rounded-[2.5rem] border border-outline-variant/10 p-0 shadow-2xl bg-surface-container-lowest text-on-surface overflow-hidden',
        'backdrop:bg-black/80 backdrop:backdrop-blur-sm animate-fade-in',
        sizeClass
      )}
      style={{ margin: 'auto' }}
    >
      {open && (
        <div className="flex flex-col h-full">
          {title && (
            <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10">
              <h2 className="text-xl font-black tracking-tight">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-surface-container-low text-on-surface-variant transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}
          <div className="p-8">{children}</div>
        </div>
      )}
    </dialog>
  );
}
