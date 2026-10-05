import React from 'react';

const Input = React.forwardRef(({ 
  label,
  error,
  success,
  helperText,
  className = '',
  id,
  ...props 
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="input-group">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`input-field ${error ? 'error' : ''} ${success ? 'success' : ''} ${className}`}
        {...props}
      />
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      {helperText && !error && !success && <p className="helper-text">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;