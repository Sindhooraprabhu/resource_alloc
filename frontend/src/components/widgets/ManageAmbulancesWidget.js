import React, { useEffect, useState } from 'react';
import ambulanceService from '../../services/ambulanceService';

const ManageAmbulancesWidget = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAmbulances = async () => {
    setLoading(true);
    try {
      const data = await ambulanceService.getAmbulances();
      const list = Array.isArray(data) ? data : (data?.ambulances || data?.data || []);
      setAmbulances(list);
    } catch (err) {
      console.warn('Failed to load ambulances:', err);
      setAmbulances([
        { id: 'MH-01', name: 'Ambulance MH-01', type: 'Advanced Life Support (ALS)', baseLocation: 'City Center Station', status: 'Operational', mileage: '45,200 km', fuelLevel: '75%', assignedTo: 'Team Alpha' },
        { id: 'MH-02', name: 'Ambulance MH-02', type: 'Basic Life Support (BLS)', baseLocation: 'Ullal Outpost', status: 'Operational', mileage: '38,500 km', fuelLevel: '60%', assignedTo: 'Team Beta' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAmbulances(); }, []);
  const getStatusColor = (status) => {
    switch (String(status || 'offline').toLowerCase()) {
      case 'available':
      case 'operational': return 'bg-success/20 text-success';
      case 'en_route':
      case 'at_scene': return 'bg-info/20 text-info';
      case 'maintenance': return 'bg-warning/20 text-warning';
      case 'offline': return 'bg-error/20 text-error';
      case 'reserve': return 'bg-secondary/20 text-secondary';
      default: return 'bg-surface/20 text-text-secondary';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Advanced Life Support (ALS)': return 'bg-primary/20 text-primary';
      case 'Basic Life Support (BLS)': return 'bg-success/20 text-success';
      case 'Patient Transport Vehicle (PTV)': return 'bg-warning/20 text-warning';
      case 'Neonatal Ambulance': return 'bg-error/20 text-error';
      default: return 'bg-surface/20 text-text-secondary';
    }
  };

  const getTypeLabel = (ambulance) => {
    const labels = {
      ALS: 'Advanced Life Support (ALS)',
      BLS: 'Basic Life Support (BLS)',
      PTV: 'Patient Transport Vehicle (PTV)',
      Neonatal: 'Neonatal Ambulance'
    };
    return labels[ambulance.vehicleType] || ambulance.type || 'Ambulance';
  };

  const getLocationLabel = (ambulance) => {
    const coordinates = ambulance.currentLocation?.coordinates || ambulance.baseLocation?.coordinates;
    return coordinates?.length === 2
      ? `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`
      : ambulance.baseLocation || 'Mangalore';
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Ambulance Fleet Management</h2>
        <div className="flex items-center gap-3">
          <button onClick={loadAmbulances} className="btn-outline btn-sm p-2" disabled={loading}>
            Refresh Fleet
          </button>
          <button className="btn-primary btn-sm p-2">
            Add New Ambulance
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading && ambulances.length === 0 && <div className="text-text-secondary">Loading ambulances...</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border/50">
            <thead className="bg-border/50">
              <tr>
                <th className="px-4 py-3 text-left text-text-xs font-medium text-text-primary uppercase tracking-wider">
                  Ambulance ID
                </th>
                <th className="px-4 py-3 text-left text-text-xs font-medium text-text-primary uppercase tracking-wider">
                  Name / Type
                </th>
                <th className="px-4 py-3 text-left text-text-xs font-medium text-text-primary uppercase tracking-wider">
                  Base Location
                </th>
                <th className="px-4 py-3 text-left text-text-xs font-medium text-text-primary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-text-xs font-medium text-text-primary uppercase tracking-wider">
                  Fuel Level
                </th>
                <th className="px-4 py-3 text-left text-text-xs font-medium text-text-primary uppercase tracking-wider">
                  Mileage
                </th>
                <th className="px-4 py-3 text-left text-text-xs font-medium text-text-primary uppercase tracking-wider">
                  Assigned Team
                </th>
                <th className="px-4 py-3 text-left text-text-xs font-medium text-text-primary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border/50">
              {ambulances.map(ambulance => (
                <tr key={ambulance.id || ambulance._id} className="hover:bg-primary/5">
                  <td className="px-4 py-4 text-text-sm font-medium text-text-primary">
                    {ambulance.id || ambulance._id}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{ambulance.vehicleNumber || ambulance.name || ambulance._id}</span>
                      <span className={`text-text-xs text-text-secondary ${getTypeColor(getTypeLabel(ambulance))}`}>
                        [{getTypeLabel(ambulance)}]
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-text-sm">{getLocationLabel(ambulance)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ambulance.status)}`}>
                        {ambulance.status || 'offline'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-text-sm">{ambulance.maintenance?.fuelLevel ?? '--'}%</td>
                  <td className="px-4 py-4 text-text-sm">{ambulance.maintenance?.mileage ?? '--'} km</td>
                  <td className="px-4 py-4 text-text-sm">{ambulance.crew?.driver?.name || ambulance.assignedTo || ambulance.team || 'Unassigned'}</td>
                  <td className="px-4 py-4 text-right space-x-2">
                    <button
                        onClick={() => alert(`Editing ambulance ${ambulance.vehicleNumber || ambulance._id}`)}
                      className="btn-outline px-3 py-1 text-text-xs"
                    >
                      Edit
                    </button>
                    <button
                        onClick={() => alert(`Viewing details for ${ambulance.vehicleNumber || ambulance._id}`)}
                      className="btn-outline px-3 py-1 text-text-xs"
                    >
                      View
                    </button>
                    <button
                        onClick={() => alert(`Scheduling maintenance for ${ambulance.vehicleNumber || ambulance._id}`)}
                      className="btn-outline px-3 py-1 text-text-xs"
                    >
                      Maintain
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between text-text-sm">
          <span className="text-text-secondary">Total Ambulances: {ambulances.length}</span>
            <span className="text-text-secondary">Available: {ambulances.filter(a => a.status === 'available').length}</span>
        </div>
      </div>
    </div>
  );
};

export default ManageAmbulancesWidget;