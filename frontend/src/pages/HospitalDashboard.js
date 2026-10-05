import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import IncomingRequestsWidget from '../components/widgets/IncomingRequestsWidget';
import HospitalResourcesWidget from '../components/widgets/HospitalResourcesWidget';
import CurrentPatientsWidget from '../components/widgets/CurrentPatientsWidget';
import ResourceUtilizationWidget from '../components/widgets/ResourceUtilizationWidget';

const HospitalDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    // Fetch hospital dashboard data
    console.log('Loading hospital dashboard data...');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome, {user?.name || 'Hospital Staff'}!
          </h1>
          <p className="text-text-lg text-text-secondary">
            Hospital Emergency Management
          </p>
        </header>

        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-sm text-text-secondary">Incoming Requests</p>
                  <p className="text-2xl font-bold text-text-primary">3</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-sm text-text-secondary">Current Patients</p>
                  <p className="text-2xl font-bold text-text-primary">12</p>
                </div>
                <div className="p-3 bg-success/10 rounded-lg">
                  <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-sm text-text-secondary">ICU Bed Occupancy</p>
                  <p className="text-2xl font-bold text-text-primary">65%</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-lg">
                  <svg className="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-sm text-text-secondary">Blood Inventory</p>
                  <p className="text-2xl font-bold text-text-primary">A+: 12 units</p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <div className="space-y-6">
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'requests' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Incoming Requests
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'resources' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Hospital Resources
              </button>
              <button
                onClick={() => setActiveTab('patients')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'patients' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Current Patients
              </button>
              <button
                onClick={() => setActiveTab('utilization')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'utilization' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Resource Utilization
              </button>
            </div>

            {activeTab === 'requests' && (
              <IncomingRequestsWidget />
            )}

            {activeTab === 'resources' && (
              <HospitalResourcesWidget />
            )}

            {activeTab === 'patients' && (
              <CurrentPatientsWidget />
            )}

            {activeTab === 'utilization' && (
              <ResourceUtilizationWidget />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;