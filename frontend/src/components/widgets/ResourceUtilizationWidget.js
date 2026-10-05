import React, { useState, useEffect } from 'react';
import hospitalService from '../../services/hospitalService';

const DEMO_UTILIZATION = [
  { name: 'ICU Beds', value: 65, color: 'bg-warning/20 text-warning' },
  { name: 'General Beds', value: 30, color: 'bg-success/20 text-success' },
  { name: 'Ventilators', value: 60, color: 'bg-warning/20 text-warning' },
  { name: 'Blood Bank', value: 42, color: 'bg-success/20 text-success' },
  { name: 'Doctors', value: 68, color: 'bg-warning/20 text-warning' },
  { name: 'Specialists', value: 75, color: 'bg-warning/20 text-warning' },
  { name: 'Emergency OR', value: 40, color: 'bg-success/20 text-success' },
  { name: 'Radiology', value: 55, color: 'bg-secondary/20 text-secondary' }
];

const DEMO_TRENDS = [
  { month: 'Jan', icu: 58, general: 25, blood: 35 },
  { month: 'Feb', icu: 62, general: 28, blood: 38 },
  { month: 'Mar', icu: 65, general: 30, blood: 42 },
  { month: 'Apr', icu: 60, general: 32, blood: 40 },
  { month: 'May', icu: 63, general: 29, blood: 41 },
  { month: 'Jun', icu: 65, general: 30, blood: 42 }
];

const ResourceUtilizationWidget = () => {
  const [utilizationData, setUtilizationData] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUtilization = async () => {
      try {
        setLoading(true);
        const data = await hospitalService.getHospitals();
        const list = Array.isArray(data) ? data : (data.data || data.hospitals || []);
        if (list.length > 0) {
          const res = list[0].resources || {};
          const beds = res.beds || {};
          const ventilators = res.ventilators || {};
          const staff = res.staff || {};
          const bloodBank = res.bloodBank || {};

          const calcPct = (avail, total) => total ? Math.round(((total - avail) / total) * 100) : 50;

          const mapped = [
            { name: 'ICU Beds', value: calcPct(beds.icuAvailable ?? 8, beds.icuTotal ?? 25), color: 'bg-warning/20 text-warning' },
            { name: 'General Beds', value: calcPct(beds.generalAvailable ?? 45, beds.generalTotal ?? 150), color: 'bg-success/20 text-success' },
            { name: 'Ventilators', value: calcPct(ventilators.available ?? 5, ventilators.total ?? 15), color: 'bg-warning/20 text-warning' },
            { name: 'Blood Bank', value: bloodBank.units ?? 42, color: 'bg-success/20 text-success' },
            { name: 'Doctors', value: staff.doctorsAvailable ?? 8, color: 'bg-warning/20 text-warning' },
            { name: 'Specialists', value: staff.specialistsAvailable ?? 3, color: 'bg-warning/20 text-warning' }
          ];
          setUtilizationData(mapped.length ? mapped : DEMO_UTILIZATION);
        } else {
          setUtilizationData(DEMO_UTILIZATION);
        }
        setMonthlyTrends(DEMO_TRENDS);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch resource utilization:', err);
        setError('Unable to load resource utilization');
        setUtilizationData(DEMO_UTILIZATION);
        setMonthlyTrends(DEMO_TRENDS);
      } finally {
        setLoading(false);
      }
    };

    fetchUtilization();
  }, []);

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Resource Utilization</h2>
        <button className="btn-outline btn-sm p-2">
          View Analytics
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error && utilizationData.length === 0 ? (
        <p className="text-text-secondary text-center py-4">{error}</p>
      ) : (
        <div className="space-y-6">
          {/* Current Utilization */}
          <div className="space-y-4">
            {utilizationData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div>
                  <h3 className="font-medium text-text-primary">{item.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-16 bg-border/30 h-2 rounded-full overflow-hidden`}>
                    <div className={`h-full ${item.value > 60 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${Math.min(100, item.value)}%` }}></div>
                  </div>
                  <span className="text-text-sm font-medium">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly Trends Chart */}
          <div>
            <h3 className="font-medium text-text-primary mb-3">Monthly Trends (Last 6 Months)</h3>
            <div className="bg-surface rounded-lg p-4 h-96">
              {/* Chart would be rendered here */}
              <div className="flex items-center justify-center h-full text-text-secondary">
                Resource Utilization Trends Chart
                <div className="mt-3 space-x-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary rounded"></div>
                    <span className="text-text-xs">ICU</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-success rounded"></div>
                    <span className="text-text-xs">General Beds</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-secondary rounded"></div>
                    <span className="text-text-xs">Blood Bank</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceUtilizationWidget;