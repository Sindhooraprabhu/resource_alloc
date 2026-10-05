import React, { useState, useEffect } from 'react';
import hospitalService from '../../services/hospitalService';

const ManageHospitalsWidget = () => {
  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    area: '',
    phone: '',
    emergencyContact: '',
    hospitalType: 'General',
    status: 'operational',
    emergencyDepartmentAvailable: true
  });

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const data = await hospitalService.getHospitals();
      if (data && data.length > 0) {
        setHospitals(data);
      }
    } catch (err) {
      console.warn('API error, using demo Mangalore hospitals dataset:', err);
      // Demo dataset if backend offline
      setHospitals([
        { _id: '1', name: 'KMC Hospital Attavar', code: 'KMC-ATT', area: 'Attavar', contact: { phone: '+91 824 242 4242', emergency: '+91 824 242 4243' }, resources: { beds: { icuAvailable: 8, total: 200 } }, status: 'operational', currentLoad: 45 },
        { _id: '2', name: 'KMC Hospital Jyothi', code: 'KMC-JYO', area: 'Jyothi', contact: { phone: '+91 824 221 1222', emergency: '+91 824 221 1223' }, resources: { beds: { icuAvailable: 5, total: 150 } }, status: 'operational', currentLoad: 30 },
        { _id: '3', name: 'A.J. Hospital & Research Centre', code: 'AJH-KUN', area: 'Kuntikan', contact: { phone: '+91 824 222 5533', emergency: '+91 824 222 5534' }, resources: { beds: { icuAvailable: 2, total: 250 } }, status: 'operational', currentLoad: 80 },
        { _id: '4', name: 'Father Muller Medical College Hospital', code: 'FMM-KAN', area: 'Kankanady', contact: { phone: '+91 824 223 8000', emergency: '+91 824 223 8001' }, resources: { beds: { icuAvailable: 11, total: 300 } }, status: 'operational', currentLoad: 60 },
        { _id: '5', name: 'Yenepoya Medical College Hospital', code: 'YEP-DER', area: 'Deralakatte', contact: { phone: '+91 824 220 4668', emergency: '+91 824 220 4669' }, resources: { beds: { icuAvailable: 9, total: 220 } }, status: 'operational', currentLoad: 50 },
        { _id: '6', name: 'Indiana Hospital & Heart Institute', code: 'IND-PUM', area: 'Pumpwell', contact: { phone: '+91 824 222 4111', emergency: '+91 824 222 4112' }, resources: { beds: { icuAvailable: 4, total: 120 } }, status: 'operational', currentLoad: 40 },
        { _id: '7', name: 'Unity Hospital', code: 'UNT-HIG', area: 'Highlands', contact: { phone: '+91 824 242 8111', emergency: '+91 824 242 8112' }, resources: { beds: { icuAvailable: 6, total: 100 } }, status: 'operational', currentLoad: 25 },
        { _id: '8', name: 'Highland Hospital', code: 'HLD-HIG', area: 'Highlands', contact: { phone: '+91 824 243 5311', emergency: '+91 824 243 5312' }, resources: { beds: { icuAvailable: 3, total: 80 } }, status: 'operational', currentLoad: 35 },
        { _id: '9', name: 'Srinivas Hospital', code: 'SRI-MUK', area: 'Mukka', contact: { phone: '+91 824 244 5861', emergency: '+91 824 244 5862' }, resources: { beds: { icuAvailable: 5, total: 180 } }, status: 'operational', currentLoad: 50 },
        { _id: '10', name: 'Mangala Hospital', code: 'MNG-KAD', area: 'Kadri', contact: { phone: '+91 824 244 0465', emergency: '+91 824 244 0466' }, resources: { beds: { icuAvailable: 3, total: 80 } }, status: 'operational', currentLoad: 20 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const toggleStatus = async (hospital) => {
    const newStatus = hospital.status === 'operational' ? 'offline' : 'operational';
    try {
      await hospitalService.updateHospital(hospital._id, { status: newStatus });
    } catch (err) {
      console.warn('Updating status locally:', err);
    }
    setHospitals(prev => prev.map(h => h._id === hospital._id ? { ...h, status: newStatus } : h));
  };

  const handleOpenAddModal = () => {
    setEditingHospital(null);
    setFormData({
      name: '',
      code: '',
      area: 'Mangalore',
      phone: '+91 824 ',
      emergencyContact: '+91 824 ',
      hospitalType: 'General',
      status: 'operational',
      emergencyDepartmentAvailable: true
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (h) => {
    setEditingHospital(h);
    setFormData({
      name: h.name,
      code: h.code || 'HOSP',
      area: h.area || 'Mangalore',
      phone: h.contact?.phone || '',
      emergencyContact: h.contact?.emergency || '',
      hospitalType: h.hospitalType || 'General',
      status: h.status || 'operational',
      emergencyDepartmentAvailable: h.emergencyDepartmentAvailable !== false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingHospital) {
      try {
        await hospitalService.updateHospital(editingHospital._id, formData);
      } catch (err) {
        console.warn('API error:', err);
      }
      setHospitals(prev => prev.map(h => h._id === editingHospital._id ? {
        ...h,
        name: formData.name,
        area: formData.area,
        status: formData.status,
        contact: { phone: formData.phone, emergency: formData.emergencyContact }
      } : h));
    } else {
      const newObj = {
        _id: Date.now().toString(),
        name: formData.name,
        code: formData.code,
        area: formData.area,
        contact: { phone: formData.phone, emergency: formData.emergencyContact },
        status: formData.status,
        resources: { beds: { icuAvailable: 5, total: 100 } }
      };
      try {
        await hospitalService.createHospital(formData);
      } catch (err) {
        console.warn('API error:', err);
      }
      setHospitals(prev => [...prev, newObj]);
    }
    setShowModal(false);
  };

  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) || (h.area || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || h.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-surface rounded-xl shadow-md p-6 border border-border/40">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-text-lg font-semibold text-text-primary">Admin Hospital Management</h2>
          <p className="text-xs text-text-secondary">Mangalore Emergency Network & Master Hospital Records</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadHospitals} className="btn-outline btn-sm p-2 text-xs">
            Refresh
          </button>
          <button onClick={handleOpenAddModal} className="btn-primary btn-sm p-2 text-xs font-bold">
            + Add New Hospital
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 bg-background/40 p-3 rounded-lg border border-border/40">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by hospital name or area..."
          className="flex-1 text-xs p-2 border rounded"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs p-2 border rounded"
        >
          <option value="ALL">All Statuses</option>
          <option value="operational">Operational</option>
          <option value="offline">Offline / Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/50">
          <thead className="bg-border/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase">Hospital</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase">Area / Location</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase">Emergency Contact</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase">ICU Beds</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-text-secondary uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filteredHospitals.map(h => (
              <tr key={h._id} className="hover:bg-primary/5">
                <td className="px-4 py-3">
                  <div className="font-bold text-sm text-text-primary">{h.name}</div>
                  <div className="text-xs text-text-secondary font-mono">{h.code || 'MNG-HOSP'}</div>
                </td>
                <td className="px-4 py-3 text-xs text-text-primary">{h.area || 'Mangalore'}</td>
                <td className="px-4 py-3 text-xs">
                  <div>{h.contact?.phone}</div>
                  <div className="text-text-secondary">Emerg: {h.contact?.emergency}</div>
                </td>
                <td className="px-4 py-3 text-xs font-bold text-primary">
                  {h.resources?.beds?.icuAvailable ?? 5} Available
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    h.status === 'operational' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                  }`}>
                    {h.status === 'operational' ? 'ACTIVE' : 'OFFLINE'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => toggleStatus(h)}
                    className={`btn-outline text-xs px-2 py-1 ${h.status === 'operational' ? 'text-warning' : 'text-success'}`}
                  >
                    {h.status === 'operational' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(h)}
                    className="btn-primary text-xs px-3 py-1"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Hospital Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl shadow-xl p-6 w-full max-w-md border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-4">
              {editingHospital ? `Edit Hospital: ${editingHospital.name}` : 'Add New Hospital'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-text-secondary mb-1">Hospital Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-secondary mb-1">Hospital Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary mb-1">Area / Neighborhood</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-secondary mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary mb-1">Hospital Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="operational">Operational / Active</option>
                  <option value="offline">Offline / Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline px-3 py-1.5">Cancel</button>
                <button type="submit" className="btn-primary px-4 py-1.5 font-bold">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHospitalsWidget;