import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LiveTrafficWidget from '../components/widgets/LiveTrafficWidget';
import LiveAmbulancesWidget from '../components/widgets/LiveAmbulancesWidget';
import TrafficDensityWidget from '../components/widgets/TrafficDensityWidget';
import GreenCorridorWidget from '../components/widgets/GreenCorridorWidget';

const TrafficAuthorityDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    // Fetch traffic authority dashboard data
    console.log('Loading traffic authority dashboard data...');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome, {user?.name || 'Traffic Officer'}!
          </h1>
          <p className="text-text-lg text-text-secondary">
            Traffic Management & Emergency Response Coordination
          </p>
        </header>
        
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-sm text-text-secondary">Live Ambulances</p>
                  <p className="text-2xl font-bold text-text-primary">5</p>
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
                  <p className="text-text-sm text-text-secondary">Active Green Corridors</p>
                  <p className="text-2xl font-bold text-text-primary">2</p>
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
                  <p className="text-text-sm text-text-secondary">Avg. Response Time</p>
                  <p className="text-2xl font-bold text-text-primary">6.8 min</p>
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
                  <p className="text-text-sm text-text-secondary">Traffic Incidents</p>
                  <p className="text-2xl font-bold text-text-primary">3</p>
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
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'overview' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('traffic')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'traffic' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Live Traffic
              </button>
              <button
                onClick={() => setActiveTab('ambulances')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'ambulances' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Live Ambulances
              </button>
              <button
                onClick={() => setActiveTab('density')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'density' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Traffic Density
              </button>
              <button
                onClick={() => setActiveTab('corridor')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'corridor' ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-border hover:bg-primary/10'}`}
              >
                Green Corridor
              </button>
            </div>
            
            {activeTab === 'overview' && (
              <div className="grid gap-6 md:grid-cols-2">
                <LiveTrafficWidget />
                <LiveAmbulancesWidget />
                <TrafficDensityWidget />
                <GreenCorridorWidget />
              </div>
            )}
            
            {activeTab === 'traffic' && (
              <LiveTrafficWidget full={true} />
            )}
            
            {activeTab === 'ambulances' && (
              <LiveAmbulancesWidget full={true} />
            )}
            
            {activeTab === 'density' && (
              <TrafficDensityWidget full={true} />
            )}
            
            {activeTab === 'corridor' && (
              <GreenCorridorWidget full={true} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficAuthorityDashboard;