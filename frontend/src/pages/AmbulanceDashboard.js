import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AssignedCasesWidget from '../components/widgets/AssignedCasesWidget';
import PatientVitalsWidget from '../components/widgets/PatientVitalsWidget';
import NavigationWidget from '../components/widgets/NavigationWidget';
import CaseTimelineWidget from '../components/widgets/CaseTimelineWidget';
import DriverLocationTracker from '../components/widgets/DriverLocationTracker';
import ambulanceService from '../services/ambulanceService';
import emergencyService from '../services/emergencyService';

const AmbulanceDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assigned');
  const [ambulance, setAmbulance] = useState(null);
  const [emergency, setEmergency] = useState(null);
  
  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const ambulances = await ambulanceService.getAmbulances();
        const linkedVehicle = user?.ambulanceInfo?.vehicleNumber;
        const linkedAmbulance = (ambulances || []).find(item => item.vehicleNumber === linkedVehicle);
        setAmbulance(linkedAmbulance || null);
        if (linkedAmbulance?.currentAssignment) {
          const assignedEmergency = await emergencyService.getEmergencyById(linkedAmbulance.currentAssignment);
          setEmergency(assignedEmergency);
        }
      } catch (error) {
        console.warn('Unable to load ambulance assignment:', error);
      }
    };
    loadAssignment();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome, {user?.name || 'Ambulance Staff'}!
          </h1>
          <p className="text-text-lg text-text-secondary">
            Emergency Response Management
          </p>
        </header>

        <DriverLocationTracker ambulance={ambulance} emergency={emergency} />
        
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-sm text-text-secondary">Assigned Cases</p>
                  <p className="text-2xl font-bold text-text-primary">2</p>
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
                  <p className="text-text-sm text-text-secondary">Patients Transported</p>
                  <p className="text-2xl font-bold text-text-primary">24</p>
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
                  <p className="text-text-sm text-text-secondary">Average Response Time</p>
                  <p className="text-2xl font-bold text-text-primary">8.2 min</p>
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
                  <p className="text-text-sm text-text-secondary">Distance Today</p>
                  <p className="text-2xl font-bold text-text-primary">124 km</p>
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
                onClick={() => setActiveTab('assigned')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'assigned' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Assigned Cases
              </button>
              <button
                onClick={() => setActiveTab('navigation')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'navigation' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Navigation
              </button>
              <button
                onClick={() => setActiveTab('vitals')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'vitals' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Patient Vitals
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'timeline' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Case Timeline
              </button>
            </div>
            
            {activeTab === 'assigned' && (
              <AssignedCasesWidget />
            )}
            
            {activeTab === 'navigation' && (
              <NavigationWidget />
            )}
            
            {activeTab === 'vitals' && (
              <PatientVitalsWidget />
            )}
            
            {activeTab === 'timeline' && (
              <CaseTimelineWidget />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceDashboard;