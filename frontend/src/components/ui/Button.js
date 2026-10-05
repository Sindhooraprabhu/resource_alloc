import React from 'react';

const Button = React.forwardRef((
  {
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    onClick,
    type = 'button',
    className = '',
    leftIcon,
    rightIcon,
    ...props
  },
  ref
) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-all duration-200 whitespace-nowrap';

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:ring-opacity-35 shadow-lg',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark focus:ring-2 focus:ring-secondary focus:ring-opacity-35 shadow-lg',
    success: 'bg-success text-white hover:bg-success-dark focus:ring-2 focus:ring-success focus:ring-opacity-35 shadow-sm',
    warning: 'bg-warning text-white hover:bg-warning-dark focus:ring-2 focus:ring-warning focus:ring-opacity-35 shadow-sm',
    error: 'bg-error text-white hover:bg-error-dark focus:ring-2 focus:ring-error focus:ring-opacity-35 shadow-sm',
    info: 'bg-info text-white hover:bg-info-dark focus:ring-2 focus:ring-info focus:ring-opacity-35 shadow-sm',
    outline: 'border border-primary text-primary bg-transparent hover:bg-primary-light/20 focus:ring-2 focus:ring-primary focus:ring-opacity-35 shadow-sm',
    ghost: 'text-primary bg-transparent hover:bg-primary-light/15',
    emergency: 'bg-emergency text-white font-semibold hover:bg-emergency-dark focus:ring-2 focus:ring-emergency focus:ring-opacity-35 shadow-md',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = (disabled || loading) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';
  const loadingClass = loading ? 'relative text-transparent transition-none' : '';

  const variantClass = variantClasses[variant] || variantClasses.primary;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const classNames = [
    baseClasses,
    variantClass,
    sizeClass,
    widthClass,
    disabledClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classNames}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      <span className={loading ? 'invisible' : 'flex items-center gap-2'}>
        {leftIcon && !loading && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span>{children}</span>
        {rightIcon && !loading && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </span>
    </button>
  );
});

Button.displayName = 'Button';

export default Button;