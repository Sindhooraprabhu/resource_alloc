import React from 'react';
import { Card, Badge, Button, LoadingSpinner, EmptyState } from '../ui';
import HospitalCard from './HospitalCard';

const HospitalList = ({ 
  hospitals = [],
  loading = false,
  onSelect,
  onViewDetails,
  showDistance = true,
  showResources = true,
  showStatus = true,
  variant = 'card',
  filters = {},
  onFilterChange,
  className = '',
  emptyMessage = 'No hospitals found',
  emptyIllustration = 'hospital'
}) => {
  const filteredHospitals = hospitals.filter(hospital => {
    if (filters.status && hospital.status !== filters.status) return false;
    if (filters.hospitalType && hospital.hospitalType !== filters.hospitalType) return false;
    if (filters.area && hospital.area !== filters.area) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const nameMatch = hospital.name.toLowerCase().includes(searchLower);
      const areaMatch = hospital.area.toLowerCase().includes(searchLower);
      const addressMatch = hospital.address?.city.toLowerCase().includes(searchLower);
      if (!nameMatch && !areaMatch && !addressMatch) return false;
    }
    if (filters.hasSpecialty && hospital.details?.specialties) {
      if (!hospital.details.specialties.includes(filters.hasSpecialty)) return false;
    }
    if (filters.acceptingPatients && hospital.resources?.emergencyCapacity?.acceptingEmergencyPatients === false) {
      return false;
    }
    if (filters.minIcuBeds && (hospital.resources?.beds?.icuAvailable || 0) < filters.minIcuBeds) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className={className}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-border/50 rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-border/50 rounded" />
                      <div className="h-3 w-64 bg-border/50 rounded" />
                    </div>
                  </div>
                  <div className="w-24 h-6 bg-border/50 rounded-full" />
                </div>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-16 bg-border/50 rounded-lg" />
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  if (filteredHospitals.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          illustration={emptyIllustration}
          title="No Hospitals Found"
          description={emptyMessage}
          action={filters.search && (
            <Button variant="outline" onClick={() => onFilterChange?.({ search: '' })}>
              Clear Search
            </Button>
          )}
        />
      </div>
    );
  }

  const sortedHospitals = [...filteredHospitals].sort((a, b) => {
    if (filters.sortBy === 'distance') {
      return (a.distance || 999) - (b.distance || 999);
    }
    if (filters.sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (filters.sortBy === 'icuAvailable') {
      return (b.resources?.beds?.icuAvailable || 0) - (a.resources?.beds?.icuAvailable || 0);
    }
    if (filters.sortBy === 'load') {
      return (a.currentLoad || 0) - (b.currentLoad || 0);
    }
    return 0;
  });

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          Showing {filteredHospitals.length} of {hospitals.length} hospitals
        </p>
        <div className="flex items-center gap-2">
          <select
            value={filters.sortBy || 'distance'}
            onChange={(e) => onFilterChange?.({ sortBy: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-surface"
          >
            <option value="distance">Sort by Distance</option>
            <option value="name">Sort by Name</option>
            <option value="icuAvailable">Sort by ICU Available</option>
            <option value="load">Sort by Load</option>
          </select>
        </div>
      </div>

      {variant === 'card' && (
        <div className="space-y-4">
          {sortedHospitals.map((hospital) => (
            <HospitalCard
              key={hospital._id || hospital.id}
              hospital={hospital}
              onClick={onSelect}
              showDistance={showDistance}
              showResources={showResources}
              showStatus={showStatus}
            />
          ))}
        </div>
      )}

      {variant === 'compact' && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedHospitals.map((hospital) => (
            <HospitalCard
              key={hospital._id || hospital.id}
              hospital={hospital}
              onClick={onSelect}
              variant="compact"
              showDistance={showDistance}
              showStatus={showStatus}
            />
          ))}
        </div>
      )}

      {variant === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-border/30">
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Hospital</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Area</th>
                {showDistance && <th className="px-4 py-3 text-left font-semibold text-text-secondary">Distance</th>}
                {showResources && <th className="px-4 py-3 text-left font-semibold text-text-secondary">Beds</th>}
                {showResources && <th className="px-4 py-3 text-left font-semibold text-text-secondary">ICU</th>}
                {showStatus && <th className="px-4 py-3 text-left font-semibold text-text-secondary">Status</th>}
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedHospitals.map((hospital) => (
                <tr key={hospital._id || hospital.id} className="border-b border-border/50 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary">{hospital.name}</div>
                    <div className="text-sm text-text-secondary">{hospital.code}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{hospital.hospitalType}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{hospital.area}</td>
                  {showDistance && (
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {hospital.distance !== undefined ? `${hospital.distance.toFixed(1)} km` : 'N/A'}
                    </td>
                  )}
                  {showResources && (
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {hospital.resources?.beds?.available || 0} / {hospital.resources?.beds?.total || 0}
                    </td>
                  )}
                  {showResources && (
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {hospital.resources?.beds?.icuAvailable || 0} / {hospital.resources?.beds?.icuTotal || 0}
                    </td>
                  )}
                  {showStatus && (
                    <td className="px-4 py-3">
                      <Badge 
                        variant={
                          hospital.status === 'operational' ? 'success' :
                          hospital.status === 'maintenance' ? 'warning' :
                          hospital.status === 'offline' ? 'error' : 'default'
                        }
                        size="sm"
                        dot
                      >
                        {hospital.status}
                      </Badge>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Button variant="outline" size="sm" onClick={() => onViewDetails?.(hospital)}>
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HospitalList;