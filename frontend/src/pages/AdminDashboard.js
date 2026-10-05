import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/ui/DashboardLayout';
import ManageHospitalsWidget from '../components/widgets/ManageHospitalsWidget';
import ManageAmbulancesWidget from '../components/widgets/ManageAmbulancesWidget';
import ManageUsersWidget from '../components/widgets/ManageUsersWidget';
import AnalyticsWidget from '../components/widgets/AnalyticsWidget';
import emergencyService from '../services/emergencyService';
import hospitalService from '../services/hospitalService';
import ambulanceService from '../services/ambulanceService';
import allocationService from '../services/allocationService';
import userService from '../services/userService';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('hospitals');
  const [stats, setStats] = useState({ hospitals: 0, ambulances: 0, active: 0 });
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [activeAllocations, setActiveAllocations] = useState([]);
  const [allocationHistory, setAllocationHistory] = useState([]);
  const [overrideCase, setOverrideCase] = useState(null);
  const [overrideHospital, setOverrideHospital] = useState('');
  const [overrideDoctor, setOverrideDoctor] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const [hospitalsRes, ambulancesRes, emergenciesRes] = await Promise.all([
        hospitalService.getHospitals(),
        ambulanceService.getAmbulances(),
        emergencyService.getActiveEmergencies(),
      ]);
      setStats({
        hospitals: (hospitalsRes || []).length,
        ambulances: (ambulancesRes || []).length,
        active: (emergenciesRes || []).length,
      });
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
      setStats({ hospitals: 10, ambulances: 4, active: 3 });
    }
  };

  // Fetch active allocations for Allocation Center
  const fetchActiveAllocations = async () => {
    setLoadingAllocations(true);
    try {
      const allocations = await allocationService.getActiveAllocations();
      setActiveAllocations(allocations || []);
    } catch (err) {
      console.warn('Failed to fetch active allocations:', err);
      setActiveAllocations([]);
    } finally {
      setLoadingAllocations(false);
    }
  };

  // Fetch allocation history
  const fetchAllocationHistory = async () => {
    try {
      const history = await allocationService.getAllocationHistory();
      setAllocationHistory(history || []);
    } catch (err) {
      console.warn('Failed to fetch allocation history:', err);
      setAllocationHistory([]);
    }
  };

  // Fetch hospitals and doctors for override
  const fetchHospitalsAndDoctors = async () => {
    try {
      const [hospitalsRes, doctorsRes] = await Promise.all([
        hospitalService.getHospitals(),
        userService.getDoctors(),
      ]);
      setHospitals(hospitalsRes || []);
      setDoctors(doctorsRes || []);
    } catch (err) {
      console.warn('Failed to fetch hospitals/doctors:', err);
    }
  };

  const handleRouteRefresh = async (item) => {
    try {
      await allocationService.refreshRoute(item._id, 'moderate');
      const allocations = await allocationService.getActiveAllocations();
      setActiveAllocations(allocations || []);
    } catch (err) {
      window.alert(err.message || 'Unable to refresh route');
    }
  };

  const handleNotifyPatient = async (item) => {
    const message = window.prompt(`Send an update to ${item.patient?.name || 'the patient'}:`);
    if (!message) return;
    try {
      await allocationService.notifyPatient(item._id, message, 'UPDATE');
      window.alert('Patient update sent and saved to the case timeline.');
    } catch (err) {
      window.alert(err.message || 'Unable to send patient update');
    }
  };

  const handleManualAllocation = async () => {
    if (!overrideCase || !overrideHospital) return;
    setOverrideLoading(true);
    try {
      await allocationService.manualAllocation(overrideCase._id, {
        hospitalId: overrideHospital,
        doctorId: overrideDoctor || undefined,
      });
      window.alert('Manual allocation complete. Resources reserved.');
      setOverrideCase(null);
      fetchActiveAllocations();
    } catch (err) {
      window.alert(err.message || 'Manual allocation failed');
    } finally {
      setOverrideLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchHospitalsAndDoctors();
  }, []);

  useEffect(() => {
    if (activeTab === 'allocation-center') {
      fetchActiveAllocations();
    }
    if (activeTab === 'history') {
      fetchAllocationHistory();
    }
  }, [activeTab]);

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name || 'Administrator'}!`}
      subtitle="System Administration & Hospital Resource Allocation Center"
      breadcrumbs={[
        { label: 'Home', href: '/admin/dashboard' },
        { label: 'Admin Dashboard' },
      ]}
    >
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-text-secondary">Hospitals Managed</p>
                <p className="text-2xl font-bold text-text-primary">{stats.hospitals}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-text-secondary">Ambulances Fleet</p>
                <p className="text-2xl font-bold text-text-primary">{stats.ambulances}</p>
              </div>
              <div className="p-3 bg-success/10 rounded-2xl text-success">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-text-secondary">Active Emergency Cases</p>
                <p className="text-2xl font-bold text-text-primary">{stats.active}</p>
              </div>
              <div className="p-3 bg-warning/10 rounded-2xl text-warning">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-text-secondary">Allocation Center</p>
                <p className="text-2xl font-bold text-text-primary">{activeAllocations.length}</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setActiveTab('hospitals')}
              className={`px-4 py-2 rounded-2xl font-semibold text-xs transition-all ${activeTab === 'hospitals' ? 'bg-primary text-white shadow-soft' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
            >
              Manage Hospitals
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-2xl font-semibold text-xs transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-soft' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
            >
              Allocation History Log
            </button>
            <button
              onClick={() => setActiveTab('ambulances')}
              className={`px-4 py-2 rounded-2xl font-semibold text-xs transition-all ${activeTab === 'ambulances' ? 'bg-primary text-white shadow-soft' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
            >
              Manage Ambulances
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-2xl font-semibold text-xs transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow-soft' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
            >
              Manage Users
            </button>
            <button
              onClick={() => setActiveTab('allocation-center')}
              className={`px-4 py-2 rounded-2xl font-semibold text-xs transition-all ${activeTab === 'allocation-center' ? 'bg-primary text-white shadow-soft' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
            >
              📞 Allocation Center
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-2xl font-semibold text-xs transition-all ${activeTab === 'analytics' ? 'bg-primary text-white shadow-soft' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
            >
              Analytics & Reports
            </button>
          </div>

          {activeTab === 'hospitals' && (
            <ManageHospitalsWidget />
          )}

          {activeTab === 'history' && (
            <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/40">
              <h2 className="text-lg font-semibold text-text-primary mb-2">AI Hospital Allocation History</h2>
              <p className="text-sm text-text-secondary mb-5">Complete audit trail of AI scoring, hospital recommendations, and confirmations</p>

              <div className="overflow-x-auto rounded-3xl border border-border/50">
                <table className="min-w-full divide-y divide-border/50 text-sm">
                  <thead className="bg-border/30 text-text-secondary uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-3 py-3 text-left">Case / Patient</th>
                      <th className="px-3 py-3 text-left">Recommended Hospital</th>
                      <th className="px-3 py-3 text-left">AI Reason</th>
                      <th className="px-3 py-3 text-left">Resources Required</th>
                      <th className="px-3 py-3 text-left">Response</th>
                      <th className="px-3 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 bg-surface">
                    {allocationHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-primary/5 transition-colors">
                        <td className="px-3 py-4">
                          <div className="font-semibold text-primary font-mono">{item.caseId}</div>
                          <div className="text-text-secondary">{item.patientName}</div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="font-semibold text-text-primary">{item.recommendedHospital}</div>
                          <div className="text-xs text-text-secondary">ETA: {item.travelTime}</div>
                        </td>
                        <td className="px-3 py-4 max-w-xs text-text-secondary">{item.reason}</td>
                        <td className="px-3 py-4 font-semibold text-text-primary">{item.resourcesRequired}</td>
                        <td className="px-3 py-4">
                          <span className="inline-flex rounded-full bg-success/20 px-3 py-1 text-success font-semibold text-xs">{item.hospitalResponse}</span>
                        </td>
                        <td className="px-3 py-4 font-semibold text-text-primary">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'allocation-center' && (
            <div className="space-y-6">
              <div className="bg-surface rounded-3xl shadow-soft p-6 border border-border/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Active Emergency Allocations</h2>
                    <p className="text-sm text-text-secondary mt-1">Live view of all ongoing resource allocations</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border/50">
                  <table className="min-w-full divide-y divide-border/50 text-sm">
                    <thead className="bg-border/30 text-text-secondary uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-3 py-3 text-left">Case</th>
                        <th className="px-3 py-3 text-left">Patient</th>
                        <th className="px-3 py-3 text-left">Hospital</th>
                        <th className="px-3 py-3 text-left">Resources</th>
                        <th className="px-3 py-3 text-left">Resource Lock</th>
                        <th className="px-3 py-3 text-left">Doctor / Route</th>
                        <th className="px-3 py-3 text-left">Status</th>
                        <th className="px-3 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 bg-surface">
                      {loadingAllocations ? (
                        <tr><td colSpan={8} className="px-3 py-6 text-center text-text-secondary">Loading allocations...</td></tr>
                      ) : activeAllocations.length > 0 ? (
                        activeAllocations.map((item) => (
                          <React.Fragment key={item._id}>
                            <tr className="hover:bg-primary/5 transition-colors">
                              <td className="px-3 py-4">
                                <span className="font-mono font-semibold text-primary text-xs">{item.emergencyId}</span>
                              </td>
                              <td className="px-3 py-4 font-medium text-text-primary">{item.patient?.name || 'Unknown'}</td>
                              <td className="px-3 py-4 text-text-primary">{item.assignedHospital?.name || 'Not assigned'}</td>
                              <td className="px-3 py-4 text-text-secondary text-xs">
                                {item.requiredResource?.bedType || 'Emergency'} • {item.requiredResource?.specialist || ''}
                              </td>
                              <td className="px-3 py-4">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.resourceAllocation?.status === 'RESERVED' ? 'bg-success/20 text-success' :
                                  item.resourceAllocation?.status === 'PENDING' ? 'bg-warning/20 text-warning' :
                                    'bg-secondary/20 text-secondary'
                                  }`}>
                                  {item.resourceAllocation?.status || 'PENDING'}
                                </span>
                              </td>
                              <td className="px-3 py-4">
                                <div className="text-text-primary">{item.assignedDoctor?.name || 'Unassigned'}</div>
                                <div className="text-xs text-text-secondary">{item.routePlan?.algorithm || 'Route pending'} · {item.routePlan?.etaMinutes || '--'} min</div>
                              </td>
                              <td className="px-3 py-4">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.caseStatus === 'HOSPITAL ACCEPTED' ? 'bg-success/20 text-success' :
                                  item.caseStatus === 'WAITING FOR CONFIRMATION' ? 'bg-warning/20 text-warning' :
                                    item.caseStatus === 'CANCELLED' ? 'bg-error/20 text-error' :
                                      'bg-info/20 text-info'
                                  }`}>
                                  {item.caseStatus}
                                </span>
                              </td>
                              <td className="px-3 py-4">
                                <div className="flex flex-wrap gap-2">
                                  <Link to={`/emergency-case/${item._id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all">View Case</Link>
                                  <button onClick={() => { setOverrideCase(item); setOverrideHospital(item.assignedHospital?._id || ''); setOverrideDoctor(item.assignedDoctor?._id || ''); }} className="btn-outline px-3 py-1 text-xs">Override</button>
                                  <button onClick={() => handleRouteRefresh(item)} className="btn-outline px-3 py-1 text-xs">Refresh route</button>
                                  <button onClick={() => handleNotifyPatient(item)} className="btn-outline px-3 py-1 text-xs">Notify patient</button>
                                </div>
                              </td>
                            </tr>
                            {overrideCase?._id === item._id && (
                              <tr key={`${item._id}-override`} className="bg-background/60">
                                <td colSpan={8} className="px-4 py-4">
                                  <div className="grid gap-3 md:grid-cols-3 items-end">
                                    <label className="text-xs text-text-secondary">Hospital<select value={overrideHospital} onChange={(event) => setOverrideHospital(event.target.value)} className="input mt-1 w-full"><option value="">Select hospital</option>{(Array.isArray(hospitals) ? hospitals : []).map(hospital => <option key={hospital._id} value={hospital._id}>{hospital.name} · {hospital.area}</option>)}</select></label>
                                    <label className="text-xs text-text-secondary">Doctor / specialist<select value={overrideDoctor} onChange={(event) => setOverrideDoctor(event.target.value)} className="input mt-1 w-full"><option value="">Auto-assign available specialist</option>{(Array.isArray(doctors) ? doctors : []).filter(doctor => doctor.isActive !== false).map(doctor => <option key={doctor._id} value={doctor._id}>{doctor.name} · {doctor.doctorInfo?.specialization || 'General'}</option>)}</select></label>
                                    <div className="flex gap-2"><button onClick={handleManualAllocation} disabled={overrideLoading || !overrideHospital} className="btn-primary px-4 py-2">{overrideLoading ? 'Allocating...' : 'Reserve & dispatch'}</button><button onClick={() => setOverrideCase(null)} className="btn-outline px-4 py-2">Cancel</button></div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr><td colSpan={8} className="px-3 py-6 text-center text-text-secondary">No active allocations</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ambulances' && (
            <ManageAmbulancesWidget />
          )}

          {activeTab === 'users' && (
            <ManageUsersWidget />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsWidget />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;