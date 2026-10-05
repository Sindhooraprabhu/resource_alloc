import React from 'react';
import Button from './Button';

const ConfirmDialog = ({ 
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'error',
  loading = false,
  className = ''
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    error: 'btn-error',
    warning: 'btn-warning',
    primary: 'btn-primary',
    success: 'btn-success',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className={`card max-w-md shadow-xl ${className}`}>
          <div className="card-body p-6 text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${variant === 'error' ? 'bg-error/10' : variant === 'warning' ? 'bg-warning/10' : 'bg-primary/10'}`}>
              {variant === 'error' && (
                <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {variant === 'warning' && (
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {variant === 'primary' && (
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {variant === 'success' && (
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
            <p className="text-text-secondary mb-6">{message}</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                {cancelText}
              </Button>
              <Button
                variant={variantStyles[variant]}
                onClick={onConfirm}
                disabled={loading}
                loading={loading}
                className="flex-1"
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;