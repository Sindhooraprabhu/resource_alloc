import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default',
  size = 'md',
  dot = false,
  className = '' 
}) => {
  const variantClasses = {
    default: 'badge-default',
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-primary',
  };

  const sizeClasses = {
    sm: 'badge-sm',
    md: '',
    lg: 'badge-lg',
  };

  const dotColors = {
    default: 'bg-text-secondary',
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-primary',
  };

  return (
    <span className={`badge ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {dot && <span className={`badge-dot ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export default Badge;