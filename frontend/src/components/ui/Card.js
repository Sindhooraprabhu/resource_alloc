import React from 'react';

const Card = React.forwardRef(({ 
  children, 
  className = '', 
  hover = false,
  padding = 'md',
  bordered = true,
  ...props
}, ref) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 lg:p-6',
    lg: 'p-6 lg:p-8',
  };

  const borderClass = bordered ? 'border border-border/50' : '';

  const hoverClass = hover ? 'hover:shadow-md hover:-translate-y-1 transition-all duration-200' : '';

  return (
    <div 
      ref={ref}
      className={`bg-surface rounded-xl shadow-sm border border-border/50 ${paddingClasses[padding]} ${hoverClass} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

const CardHeader = ({ 
  children, 
  className = '',
  action 
}) => (
  <div className={`flex items-center justify-between p-4 lg:p-6 border-b border-border/50 ${className}`}>
    <div>{children}</div>
    {action && <div className="flex-shrink-0 ml-4">{action}</div>}
  </div>
);

const CardTitle = ({ 
  children, 
  subtitle,
  className = '' 
}) => (
  <div className={className}>
    <h3 className="text-lg font-semibold text-text-primary">{children}</h3>
    {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
  </div>
);

const CardBody = ({ 
  children, 
  className = '' 
}) => (
  <div className={`p-4 lg:p-6 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ 
  children, 
  className = '',
  divided = true 
}) => (
  <div className={`p-4 lg:p-6 ${divided ? 'border-t border-border/50' : ''} ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
export { CardHeader, CardTitle, CardBody, CardFooter };