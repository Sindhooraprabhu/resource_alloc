import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import IncomingPatientsWidget from '../components/widgets/IncomingPatientsWidget';
import PatientHistoryWidget from '../components/widgets/PatientHistoryWidget';
import LiveVitalsWidget from '../components/widgets/LiveVitalsWidget';
import TreatmentTimelineWidget from '../components/widgets/TreatmentTimelineWidget';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('incoming');

  useEffect(() => {
    // Fetch doctor dashboard data
    console.log('Loading doctor dashboard data...');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome, Dr. {user?.name || 'Doctor'}!
          </h1>
          <p className="text-text-lg text-text-secondary">
            Patient Care & Treatment Management
          </p>
        </header>

        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface rounded-xl shadow-md border border-border/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-sm text-text-secondary">Incoming Patients</p>
                  <p className="text-2xl font-bold text-text-primary">2</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-md border border-border/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-sm text-text-secondary">Patients Today</p>
                  <p className="text-2xl font-bold text-text-primary">15</p>
                </div>
                <div className="p-3 bg-success/10 rounded-lg">
                  <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-md border border-border/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-sm text-text-secondary">Critical Cases</p>
                  <p className="text-2xl font-bold text-text-primary">3</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-lg">
                  <svg className="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-md border border-border/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-sm text-text-secondary">Avg. Response Time</p>
                  <p className="text-2xl font-bold text-text-primary">5.2 min</p>
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
            <div className="flex flex-wrap gap-4 mb-4">
              <button
                onClick={() => setActiveTab('incoming')}
                className={`px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${activeTab === 'incoming' ? 'bg-primary text-white border border-primary' : 'bg-surface text-text-primary border border-border hover:bg-primary/10 hover:text-white'}`}
              >
                Incoming Patients
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${activeTab === 'history' ? 'bg-primary text-white border border-primary' : 'bg-surface text-text-primary border border-border hover:bg-primary/10 hover:text-white'}`}
              >
                Patient History
              </button>
              <button
                onClick={() => setActiveTab('vitals')}
                className={`px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${activeTab === 'vitals' ? 'bg-primary text-white border border-primary' : 'bg-surface text-text-primary border border-border hover:bg-primary/10 hover:text-white'}`}
              >
                Live Vitals
              </button>
              <button
                onClick={() => setActiveTab('treatment')}
                className={`px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${activeTab === 'treatment' ? 'bg-primary text-white border border-primary' : 'bg-surface text-text-primary border border-border hover:bg-primary/10 hover:text-white'}`}
              >
                Treatment Timeline
              </button>
            </div>

            {activeTab === 'incoming' && (
              <IncomingPatientsWidget />
            )}

            {activeTab === 'history' && (
              <PatientHistoryWidget />
            )}

            {activeTab === 'vitals' && (
              <LiveVitalsWidget />
            )}

            {activeTab === 'treatment' && (
              <TreatmentTimelineWidget />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;