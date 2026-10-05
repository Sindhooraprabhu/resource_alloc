import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmergencySOSWidget from '../components/widgets/EmergencySOSWidget';
import NearbyHospitalsWidget from '../components/widgets/NearbyHospitalsWidget';
import EmergencyHistoryWidget from '../components/widgets/EmergencyHistoryWidget';
import TrackAmbulanceWidget from '../components/widgets/TrackAmbulanceWidget';
import AIAssistantWidget from '../components/widgets/AIAssistantWidget';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState(3);
  
  useEffect(() => {
    // Fetch citizen dashboard data
    console.log('Loading citizen dashboard data...');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="header-mobile">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              LH
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">LifeLink AI</h1>
              <p className="text-xs text-text-tertiary">Citizen Dashboard</p>
            </div>
          </div>
          <div className="relative">
            <button className="w-10 h-10 bg-surface rounded-full flex items-center justify-center relative">
              🔔
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Desktop Header */}
        <div className="header-desktop mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Welcome, {user?.name || 'Citizen'}!
              </h1>
              <p className="text-text-lg text-text-secondary">
                Your emergency healthcare companion
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-text-tertiary hover:text-primary transition-colors">
                🔍
              </button>
              <button className="p-2 text-text-tertiary hover:text-primary transition-colors">
                ⚙️
              </button>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0) || 'C'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">🚨</div>
              <div className="stat-content">
                <p className="stat-label">Active Emergencies</p>
                <p className="stat-value">3</p>
                <div className="stat-change positive">
                  <span>↑ 2 from yesterday</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🏥</div>
              <div className="stat-content">
                <p className="stat-label">Hospitals Nearby</p>
                <p className="stat-value">12</p>
                <div className="stat-change positive">
                  <span>↑ 3 from yesterday</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🚑</div>
              <div className="stat-content">
                <p className="stat-label">Ambulances Available</p>
                <p className="stat-value">8</p>
                <div className="stat-change negative">
                  <span>↓ 1 from yesterday</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <p className="stat-label">Emergency This Month</p>
                <p className="stat-value">24</p>
                <div className="stat-change positive">
                  <span>↑ 12% from last month</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-surface rounded-xl shadow-sm border border-border/50 p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => alert('Emergency SOS activated!')}
                className="bg-error/10 border border-error/20 text-error rounded-lg p-4 hover:bg-error/20 transition-all text-center"
              >
                <div className="text-2xl mb-2">🚨</div>
                <div className="font-medium">Activate SOS</div>
              </button>
              
              <button className="bg-primary/10 border border-primary/20 text-primary rounded-lg p-4 hover:bg-primary/20 transition-all text-center">
                <div className="text-2xl mb-2">📍</div>
                <div className="font-medium">Find Nearest Hospital</div>
              </button>
              
              <button className="bg-success/10 border border-success/20 text-success rounded-lg p-4 hover:bg-success/20 transition-all text-center">
                <div className="text-2xl mb-2">📱</div>
                <div className="font-medium">Health Check</div>
              </button>
            </div>
          </div>
          
          {/* Main Content Tabs */}
          <div className="bg-surface rounded-xl shadow-sm border border-border/50">
            <div className="tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('emergency')}
                className={`tab ${activeTab === 'emergency' ? 'active' : ''}`}
              >
                Emergency
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('help')}
                className={`tab ${activeTab === 'help' ? 'active' : ''}`}
              >
                Help & Resources
              </button>
            </div>
            
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="grid gap-6 md:grid-cols-2">
                  <EmergencySOSWidget />
                  <NearbyHospitalsWidget />
                  <TrackAmbulanceWidget />
                  <EmergencyHistoryWidget />
                </div>
              )}
              
              {activeTab === 'emergency' && (
                <div className="grid gap-6 md:grid-cols-2">
                  <AIAssistantWidget full={true} />
                  <EmergencySOSWidget full={true} />
                </div>
              )}
              
              {activeTab === 'history' && (
                <EmergencyHistoryWidget full={true} />
              )}
              
              {activeTab === 'help' && (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
                      <h3 className="text-lg font-semibold text-primary mb-3">🚑 Emergency Guidelines</h3>
                      <ul className="space-y-2 text-sm text-text-secondary">
                        <li>• When calling emergency services, provide exact location</li>
                        <li>• Describe symptoms clearly and calmly</li>
                        <li>• Stay on the line until help arrives</li>
                        <li>• Note any allergies or medical conditions</li>
                      </ul>
                    </div>
                    
                    <div className="bg-success/5 rounded-lg p-6 border border-success/20">
                      <h3 className="text-lg font-semibold text-success mb-3">🏥 Hospital Resources</h3>
                      <ul className="space-y-2 text-sm text-text-secondary">
                        <li>• 24/7 Emergency Departments</li>
                        <li>• Specialized Medical Centers</li>
                        <li>• Telemedicine Services</li>
                        <li>• Mobile Clinic Units</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-warning/5 rounded-lg p-6 border border-warning/20">
                    <h3 className="text-lg font-semibold text-warning-dark mb-3">📞 Emergency Contacts</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="font-medium text-text-primary">Emergency Services</p>
                        <p className="text-sm text-text-secondary">Dial 911</p>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Ambulance Services</p>
                        <p className="text-sm text-text-secondary">+1-800-HELP-NOW</p>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Poison Control</p>
                        <p className="text-sm text-text-secondary">+1-800-555-1234</p>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Crisis Hotline</p>
                        <p className="text-sm text-text-secondary">+1-800-555-4444</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;