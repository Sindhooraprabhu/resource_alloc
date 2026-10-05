import React from 'react';
import { Card, Badge, Button, LoadingSpinner, EmptyState, Table } from '../ui';
import ResourceCard from './ResourceCard';

const ResourceList = ({ 
  resources = [],
  loading = false,
  onSelect,
  groupBy = null,
  variant = 'card',
  filters = {},
  onFilterChange,
  className = '',
  emptyMessage = 'No resources found',
  emptyIllustration = 'default'
}) => {
  const filteredResources = resources.filter(resource => {
    if (filters.type && resource.type !== filters.type) return false;
    if (filters.status && resource.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const nameMatch = (resource.name || resource.label || '').toLowerCase().includes(searchLower);
      if (!nameMatch) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className={className}>
        {[...Array(6)].map((_, i) => (
          <ResourceCard key={i} resource={{ type: 'beds', label: 'Loading...' }} variant="stat" />
        ))}
      </div>
    );
  }

  if (filteredResources.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          illustration={emptyIllustration}
          title="No Resources Found"
          description={emptyMessage}
        />
      </div>
    );
  }

  const groupedResources = groupBy ? 
    filteredResources.reduce((acc, resource) => {
      const key = resource[groupBy] || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(resource);
      return acc;
    }, {}) : 
    { 'All Resources': filteredResources };

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
        </p>
        {Object.keys(groupedResources).length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Group by:</span>
            <select
              value={groupBy || 'none'}
              onChange={(e) => onFilterChange?.({ groupBy: e.target.value || null })}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-surface"
            >
              <option value="none">None</option>
              <option value="type">Type</option>
              <option value="status">Status</option>
            </select>
          </div>
        )}
      </div>

      {variant === 'card' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Object.entries(groupedResources).map(([groupName, groupResources]) => (
            <React.Fragment key={groupName}>
              {Object.keys(groupedResources).length > 1 && (
                <div className="col-span-full">
                  <h4 className="font-medium text-text-primary mb-2 pb-2 border-b border-border/50">{groupName}</h4>
                </div>
              )}
              {groupResources.map((resource) => (
                <ResourceCard
                  key={resource.id || resource.name}
                  resource={resource}
                  onClick={onSelect}
                  variant="stat"
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      )}

      {variant === 'table' && (
        <Table
          columns={[
            { header: 'Resource', field: 'label', render: (val, row) => (
              <div className="flex items-center gap-2">
                <span className="text-xl">{row.icon || '📦'}</span>
                <div>
                  <div className="font-medium text-text-primary">{val || row.name}</div>
                  <div className="text-sm text-text-secondary">{row.type}</div>
                </div>
              </div>
            )},
            { header: 'Available', field: 'available', render: (val, row) => 
              val !== undefined ? `${val} ${row.unit || ''}` : 'N/A' 
            },
            { header: 'Total', field: 'total', render: (val) => val !== undefined ? val : 'N/A' },
            { header: 'Occupied', field: 'occupied', render: (val) => val !== undefined ? val : 'N/A' },
            { header: 'Status', field: 'status', render: (val, row) => (
              <Badge 
                variant={
                  val === 'available' ? 'success' :
                  val === 'limited' ? 'warning' :
                  val === 'unavailable' ? 'error' : 'default'
                }
                size="sm"
                dot
              >
                {val || 'Unknown'}
              </Badge>
            )},
            { header: 'Actions', field: 'id', render: (val, row) => (
              <Button variant="outline" size="sm" onClick={() => onSelect?.(row)}>View</Button>
            )}
          ]}
          data={filteredResources}
          keyField="id"
          onRowClick={onSelect}
          striped
          hoverable
        />
      )}

      {variant === 'summary' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Object.entries(groupedResources).map(([groupName, groupResources]) => (
            <Card key={groupName}>
              <Card.Header>
                <h4 className="font-medium text-text-primary">{groupName}</h4>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  {groupResources.map((resource) => (
                    <ResourceCard
                      key={resource.id || resource.name}
                      resource={resource}
                      onClick={onSelect}
                      variant="compact"
                    />
                  ))}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceList;