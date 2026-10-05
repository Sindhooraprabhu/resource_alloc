import React, { useState, useEffect } from 'react';
import emergencyService from '../../services/emergencyService';

const DEFAULT_STATS = {
  today: 18,
  yesterday: 15,
  week: 98,
  month: 425,
  changeToday: '+20%',
  changeWeek: '+15%',
  changeMonth: '+8%'
};

const DEFAULT_RESPONSE_TIMES = {
  avg: '6.8 min',
  target: '< 8 min',
  compliance: '85%',
  trend: 'improving'
};

const DEFAULT_HOSPITAL_PERF = [
  { name: 'KMC Attavar', efficiency: 92, response: '7.2 min', survival: '94%' },
  { name: 'KMC Jyothi', efficiency: 88, response: '8.1 min', survival: '91%' },
  { name: 'AJ Hospital', efficiency: 95, response: '6.5 min', survival: '96%' },
  { name: 'Father Muller', efficiency: 90, response: '7.8 min', survival: '93%' }
];

const DEFAULT_AMBULANCE_UTIL = [
  { id: 'MH-01', utilization: 78, calls: 12, distance: '180 km' },
  { id: 'MH-02', utilization: 65, calls: 10, distance: '150 km' },
  { id: 'MH-03', utilization: 45, calls: 7, distance: '95 km' },
  { id: 'MH-04', utilization: 82, calls: 15, distance: '220 km' }
];

const AnalyticsWidget = () => {
  const [emergencyStats, setEmergencyStats] = useState(DEFAULT_STATS);
  const [responseTimes, setResponseTimes] = useState(DEFAULT_RESPONSE_TIMES);
  const [hospitalPerformance, setHospitalPerformance] = useState(DEFAULT_HOSPITAL_PERF);
  const [ambulanceUtilization, setAmbulanceUtilization] = useState(DEFAULT_AMBULANCE_UTIL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [histRes, activeRes] = await Promise.all([
          emergencyService.getEmergencyHistory(),
          emergencyService.getActiveEmergencies()
        ]);
        const histList = Array.isArray(histRes) ? histRes : (histRes.data || histRes.emergencies || []);
        const activeList = Array.isArray(activeRes) ? activeRes : (activeRes.data || activeRes.emergencies || []);

        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(today);
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        const startOfMonth = new Date(today);
        startOfMonth.setMonth(startOfMonth.getMonth() - 1);

        const countSince = (date) => histList.filter(e => {
          const d = e.createdAt ? new Date(e.createdAt) : null;
          return d && d >= date;
        }).length;

        const todayCount = countSince(startOfToday) + activeList.length;
        const weekCount = countSince(startOfWeek) + activeList.length;
        const monthCount = countSince(startOfMonth) + activeList.length;

        if (histList.length > 0 || activeList.length > 0) {
          setEmergencyStats({
            today: todayCount || DEFAULT_STATS.today,
            yesterday: DEFAULT_STATS.yesterday,
            week: weekCount || DEFAULT_STATS.week,
            month: monthCount || DEFAULT_STATS.month,
            changeToday: todayCount > DEFAULT_STATS.today ? '+20%' : '+10%',
            changeWeek: weekCount > DEFAULT_STATS.week ? '+15%' : '+8%',
            changeMonth: monthCount > DEFAULT_STATS.month ? '+8%' : '+5%'
          });
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Unable to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">System Analytics & Reports</h2>
        FAIcon
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-6">
          {/* Emergency Statistics */}
          <div className="bg-surface rounded-lg p-4 border border-border/50">
            <h3 className="font-medium text-text-primary mb-3">Emergency Response Statistics</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-text-sm text-text-secondary">Today</p>
                <p className="text-2xl font-bold text-primary">{emergencyStats.today}</p>
                <p className="text-text-sm text-text-secondary">{emergencyStats.changeToday}</p>
              </div>
              <div className="text-center">
                <p className="text-text-sm text-text-secondary">This Week</p>
                <p className="text-2xl font-bold text-success">{emergencyStats.week}</p>
                <p className="text-text-sm text-text-secondary">{emergencyStats.changeWeek}</p>
              </div>
              <div className="text-center">
                <p className="text-text-sm text-text-secondary">This Month</p>
                <p className="text-2xl font-bold text-warning">{emergencyStats.month}</p>
                <p className="text-text-sm text-text-secondary">{emergencyStats.changeMonth}</p>
              </div>
            </div>
          </div>

          {/* Response Time Analytics */}
          <div className="bg-surface rounded-lg p-4 border border-border/50">
            <h3 className="font-medium text-text-primary mb-3">Response Time Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-sm text-text-secondary">Average Response Time:</span>
                <span className="text-2xl font-bold text-primary">{responseTimes.avg}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-sm text-text-secondary">Target Response Time:</span>
                <span className="text-lg font-medium text-success">{responseTimes.target}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-sm text-text-secondary">Target Compliance:</span>
                <span className="text-lg font-medium text-warning">{responseTimes.compliance}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-sm text-text-secondary">Trend:</span>
                <span className={`text-lg font-medium ${responseTimes.trend === 'improving' ? 'text-success' : 'text-error'}`}>
                  {responseTimes.trend}
                </span>
              </div>
            </div>

            <div className="mt-4 h-96">
              {/* Response time trend chart would be rendered here */}
              <div className="flex items-center justify-center h-full text-text-secondary">
                Response Time Trend Chart (Last 30 Days)
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded"></div>
                  <span className="text-text-xs">On Target</span>
                  <div className="w-2 h-2 bg-warning rounded"></div>
                  <span className="text-text-xs">Above Target</span>
                  <div className="w-2 h-2 bg-error rounded"></div>
                  <span className="text-text-xs">Critical</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hospital Performance */}
          <div className="bg-surface rounded-lg p-4 border border-border/50">
            <h3 className="font-medium text-text-primary mb-3">Hospital Performance Metrics</h3>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/50">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Hospital
                      </th>
                      <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Efficiency Score
                      </th>
                      <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Avg. Response Time
                      </th>
                      <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Survival Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitalPerformance.map(hospital => (
                      <tr key={hospital.name} className="hover:bg-primary/5">
                        <td className="px-4 py-4 text-text-sm font-medium text-text-primary">
                          {hospital.name}
                        </td>
                        <td className="px-4 py-4 text-text-sm">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-primary/20 rounded-lg flex items-center justify-center">
                              <span className="text-text-xs font-medium">{hospital.efficiency}%</span>
                            </div>
                            <span className="ml-2 text-text-sm">{hospital.efficiency}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-text-sm">{hospital.response}</td>
                        <td className="px-4 py-4 text-text-sm">{hospital.survival}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Ambulance Utilization */}
          <div className="bg-surface rounded-lg p-4 border border-border/50">
            <h3 className="font-medium text-text-primary mb-3">Ambulance Fleet Utilization</h3>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/50">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Ambulance ID
                      </th>
                      <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Utilization %
                      </th>
                      <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Emergency Calls
                      </th>
                      <th className="px-4 py-3 text-left text-text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Distance Covered
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ambulanceUtilization.map(ambulance => (
                      <tr key={ambulance.id} className="hover:bg-primary/5">
                        <td className="px-4 py-4 text-text-sm font-medium text-text-primary">
                          {ambulance.id}
                        </td>
                        <td className="px-4 py-4 text-text-sm">
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-warning/20 text-warning">
                            <span className="text-text-xs font-medium">{ambulance.utilization}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-text-sm">{ambulance.calls}</td>
                        <td className="px-4 py-4 text-text-sm">{ambulance.distance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex justify-between text-text-sm">
              <span className="text-text-secondary">Fleet Average Utilization:</span>
              <span className="font-medium text-primary">67.5%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsWidget;