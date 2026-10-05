import React from 'react';

const Tabs = ({ 
  tabs = [], 
  activeTab,
  onChange,
  variant = 'line',
  className = '',
  fullWidth = false
}) => {
  const variantClasses = {
    line: 'border-b border-border',
    enclosed: 'bg-border/30 rounded-lg p-1',
    soft: '',
  };

  const tabClasses = {
    line: 'border-b-2 border-transparent hover:border-primary/50',
    enclosed: 'rounded-md hover:bg-surface',
    soft: 'rounded-lg hover:bg-primary/10',
  };

  const activeClasses = {
    line: 'border-primary text-primary',
    enclosed: 'bg-surface shadow-sm text-primary',
    soft: 'bg-primary/10 text-primary',
  };

  return (
    <div className={className}>
      <div 
        className={`flex gap-1 ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''}`}
        role="tablist"
        aria-label="Tabs"
      >
        {tabs.map((tab, index) => (
          <button
            key={index}
            role="tab"
            aria-selected={activeTab === tab.value}
            aria-controls={`tabpanel-${tab.value}`}
            id={`tab-${tab.value}`}
            onClick={() => onChange(tab.value)}
            disabled={tab.disabled}
            className={`
              px-4 py-2.5 font-medium text-sm transition-all duration-200
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${tabClasses[variant]}
              ${activeTab === tab.value ? activeClasses[variant] : 'text-text-secondary'}
            `}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
            {tab.badge && <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">{tab.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

const TabPanel = ({ 
  children, 
  value,
  activeTab,
  className = ''
}) => {
  if (activeTab !== value) return null;
  return <div id={`tabpanel-${value}`} role="tabpanel" className={className}>{children}</div>;
};

Tabs.Panel = TabPanel;

export default Tabs;