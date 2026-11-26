'use client';

import React from 'react';
import { OperationsPortalGateway } from '@/components/OperationsPortalGateway';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  requiredRole?: string;
  message?: string;
  closable?: boolean;
}

export function LoginModal({ isOpen, onClose, onSuccess, closable = true }: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <OperationsPortalGateway
        closable={closable}
        onClose={onClose}
        onSuccess={() => {
          if (onSuccess) onSuccess();
          onClose();
        }}
      />
    </div>
  );
}
