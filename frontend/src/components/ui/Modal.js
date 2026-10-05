import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

const Modal = ({ 
  isOpen = false,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  footer,
  className = ''
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeOnOverlay ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          ref={modalRef}
          tabIndex={-1}
          className={`card ${sizeClasses[size]} shadow-xl ${className}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {(title || showClose) && (
            <div className="card-header border-b border-border/50">
              <div className="flex items-center justify-between">
                {title && (
                  <h2 id="modal-title" className="card-title">{title}</h2>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border/50 transition-colors"
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="card-body max-h-[70vh] overflow-y-auto">
            {children}
          </div>
          {footer && (
            <div className="card-footer border-t border-border/50 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;