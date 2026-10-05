import React from 'react';
import { forwardRef } from 'react';

const Table = forwardRef(({ 
  columns = [], 
  data = [], 
  keyField = 'id',
  onRowClick,
  striped = true,
  hoverable = true,
  bordered = true,
  loading = false,
  emptyMessage = 'No data available',
  emptyIllustration = 'default',
  className = '',
  ...props 
}, ref) => {
  const getCellValue = (row, field) => {
    if (typeof field === 'function') return field(row);
    return field.split('.').reduce((obj, key) => obj?.[key], row);
  };

  if (loading) {
    return (
      <div className="table-responsive" ref={ref} {...props}>
        <table className="table" role="table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 text-left font-semibold text-text-secondary">
                  <div className="skeleton-loader w-full" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div className="skeleton-loader w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full" ref={ref} {...props}>
        <div className="empty-state">
          <div className="empty-state-icon">
            {emptyIllustration === 'default' && '📭'}
            {emptyIllustration === 'search' && '🔍'}
            {emptyIllustration === 'filter' && '🔎'}
            {emptyIllustration === 'hospital' && '🏥'}
            {emptyIllustration === 'ambulance' && '🚑'}
            {emptyIllustration === 'patient' && '👤'}
            {emptyIllustration === 'emergency' && '🚨'}
            {emptyIllustration === 'traffic' && '🚦'}
            {emptyIllustration === 'history' && '📜'}
          </div>
          <h3 className="empty-state-title">No Data</h3>
          <p className="empty-state-description">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-responsive" ref={ref} {...props}>
      <table className="table" role="table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left font-semibold text-text-secondary"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row[keyField] || rowIndex}
              className={`
                ${striped && rowIndex % 2 === 1 ? 'bg-border/20' : ''}
                ${hoverable ? 'hover:bg-primary/5' : ''}
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-4 py-3 text-text-primary">
                  {column.render 
                    ? column.render(getCellValue(row, column.field), row)
                    : getCellValue(row, column.field)
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

Table.displayName = 'Table';

export default Table;