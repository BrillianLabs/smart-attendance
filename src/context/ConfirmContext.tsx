'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AlertCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (val: boolean) => void }) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ ...options, resolve });
    });
  }, []);

  const handleClose = (value: boolean) => {
    if (dialog) {
      dialog.resolve(value);
      setDialog(null);
    }
  };

  const Icon = {
    danger:  AlertTriangle,
    warning: AlertCircle,
    info:    HelpCircle,
  }[dialog?.variant || 'info'];

  const colorClass = {
    danger:  'text-error bg-error-container/10',
    warning: 'text-amber-500 bg-amber-500/10',
    info:    'text-primary bg-primary/10',
  }[dialog?.variant || 'info'];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      <Modal 
        open={!!dialog} 
        onClose={() => handleClose(false)} 
        size="sm"
      >
        {dialog && (
          <div className="flex flex-col items-center text-center">
            {/* Semantic Icon */}
            <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6", colorClass)}>
              <Icon size={40} />
            </div>

            <h3 className="text-2xl font-black text-on-surface tracking-tight mb-2">
              {dialog.title || 'Konfirmasi Aksi'}
            </h3>
            <p className="text-sm font-medium text-on-surface-variant opacity-70 mb-8 leading-relaxed">
              {dialog.message}
            </p>

            <div className="flex w-full gap-3">
              <button
                onClick={() => handleClose(false)}
                className="btn btn-secondary flex-1"
              >
                {dialog.cancelLabel || 'Batal'}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={cn(
                  "btn flex-1",
                  dialog.variant === 'danger' ? 'btn-danger' : 
                  dialog.variant === 'warning' ? 'bg-amber-500 text-white' : 'btn-primary'
                )}
              >
                {dialog.confirmLabel || 'Ya, Lanjut'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context.confirm;
}
