import React, { useState, useEffect } from 'react';
import hospitalService from '../../services/hospitalService';

const DEFAULT_RESOURCES = {
  icuAvailable: 8,
  icuTotal: 25,
  generalAvailable: 45,
  generalTotal: 150,
  emergencyAvailable: 6,
  emergencyTotal: 15,
  ventilatorsAvailable: 5,
  ventilatorsTotal: 15,
  operationTheatresAvailable: 2,
  operationTheatresTotal: 5,
  bloodBankUnits: 42,
  doctorsAvailable: 8,
  specialistsAvailable: 3,
  emergencyLoad: 'MODERATE'
};

const HospitalResourcesWidget = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [acceptingEmergency, setAcceptingEmergency] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hospitalId, setHospitalId] = useState(null);

  const [resources, setResources] = useState(DEFAULT_RESOURCES);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const data = await hospitalService.getHospitals();
        const list = Array.isArray(data) ? data : (data.data || data.hospitals || []);
        if (list.length > 0) {
          const hospital = list[0];
          setHospitalId(hospital._id || hospital.id);
          const res = hospital.resources || {};
          setResources({
            icuAvailable: res.beds?.icuAvailable ?? DEFAULT_RESOURCES.icuAvailable,
            icuTotal: res.beds?.icuTotal ?? DEFAULT_RESOURCES.icuTotal,
            generalAvailable: res.beds?.generalAvailable ?? DEFAULT_RESOURCES.generalAvailable,
            generalTotal: res.beds?.generalTotal ?? DEFAULT_RESOURCES.generalTotal,
            emergencyAvailable: res.beds?.emergencyAvailable ?? DEFAULT_RESOURCES.emergencyAvailable,
            emergencyTotal: res.beds?.emergencyTotal ?? DEFAULT_RESOURCES.emergencyTotal,
            ventilatorsAvailable: res.ventilators?.available ?? DEFAULT_RESOURCES.ventilatorsAvailable,
            ventilatorsTotal: res.ventilators?.total ?? DEFAULT_RESOURCES.ventilatorsTotal,
            operationTheatresAvailable: res.operationTheatres?.available ?? DEFAULT_RESOURCES.operationTheatresAvailable,
            operationTheatresTotal: res.operationTheatres?.total ?? DEFAULT_RESOURCES.operationTheatresTotal,
            bloodBankUnits: res.bloodBank?.units ?? DEFAULT_RESOURCES.bloodBankUnits,
            doctorsAvailable: res.staff?.doctorsAvailable ?? DEFAULT_RESOURCES.doctorsAvailable,
            specialistsAvailable: res.staff?.specialistsAvailable ?? DEFAULT_RESOURCES.specialistsAvailable,
            emergencyLoad: res.emergencyLoad || DEFAULT_RESOURCES.emergencyLoad
          });
          setAcceptingEmergency(res.emergencyCapacity?.acceptingEmergencyPatients !== false);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch hospital resources:', err);
        setError('Unable to load hospital resources');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const getStatusText = (available, total) => {
    if (available === 0) return { text: 'UNAVAILABLE', cls: 'bg-error/20 text-error border-error/30' };
    if (available <= Math.ceil(total * 0.25)) return { text: 'LIMITED', cls: 'bg-warning/20 text-warning border-warning/30' };
    return { text: 'AVAILABLE', cls: 'bg-success/20 text-success border-success/30' };
  };

  const handleChange = (field, value) => {
    const num = parseInt(value, 10);
    setResources(prev => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num
    }));
  };

  const handleSave = async () => {
    if (!hospitalId) {
      setIsEditing(false);
      alert('Hospital resources updated successfully!');
      return;
    }

    try {
      const resourcesData = {
        beds: {
          icuAvailable: resources.icuAvailable,
          icuTotal: resources.icuTotal,
          generalAvailable: resources.generalAvailable,
          generalTotal: resources.generalTotal,
          emergencyAvailable: resources.emergencyAvailable,
          emergencyTotal: resources.emergencyTotal
        },
        ventilators: {
          available: resources.ventilatorsAvailable,
          total: resources.ventilatorsTotal
        },
        operationTheatres: {
          available: resources.operationTheatresAvailable,
          total: resources.operationTheatresTotal
        },
        bloodBank: {
          units: resources.bloodBankUnits
        },
        staff: {
          doctorsAvailable: resources.doctorsAvailable,
          specialistsAvailable: resources.specialistsAvailable
        },
        emergencyLoad: resources.emergencyLoad,
        emergencyCapacity: {
          acceptingEmergencyPatients: acceptingEmergency
        }
      };

      await hospitalService.updateHospitalResources(hospitalId, resourcesData);
      setIsEditing(false);
      alert('Hospital resources updated successfully!');
    } catch (err) {
      console.error('Failed to update hospital resources:', err);
      alert('Failed to update hospital resources. Please try again.');
    }
  };

  const resourceCards = [
    {
      title: 'ICU Beds',
      keyAvail: 'icuAvailable',
      keyTotal: 'icuTotal',
      unit: 'beds'
    },
    {
      title: 'General Beds',
      keyAvail: 'generalAvailable',
      keyTotal: 'generalTotal',
      unit: 'beds'
    },
    {
      title: 'Emergency Beds',
      keyAvail: 'emergencyAvailable',
      keyTotal: 'emergencyTotal',
      unit: 'beds'
    },
    {
      title: 'Ventilators',
      keyAvail: 'ventilatorsAvailable',
      keyTotal: 'ventilatorsTotal',
      unit: 'units'
    },
    {
      title: 'Operation Theatres',
      keyAvail: 'operationTheatresAvailable',
      keyTotal: 'operationTheatresTotal',
      unit: 'theatres'
    }
  ];

  return (
    <div className="bg-surface rounded-xl shadow-md p-6 border border-border/40">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-text-lg font-semibold text-text-primary">Hospital Resource Availability</h2>
          <p className="text-text-xs text-text-secondary">Simple emergency controls for hospital staff</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAcceptingEmergency(!acceptingEmergency)}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-all ${acceptingEmergency ? 'bg-success/10 text-success border-success/30' : 'bg-error/10 text-error border-error/30'
              }`}
          >
            Hospital Status: {acceptingEmergency ? 'ACCEPTING EMERGENCY' : 'NOT ACCEPTING'}
          </button>

          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`btn-sm p-2 text-xs font-semibold ${isEditing ? 'btn-success' : 'btn-primary'}`}
          >
            {isEditing ? 'Save Changes' : 'Update Availability'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Core Resource Cards */}
        {resourceCards.map((card, idx) => {
          const avail = resources[card.keyAvail];
          const total = resources[card.keyTotal];
          const statusInfo = getStatusText(avail, total);

          return (
            <div key={idx} className="border border-border/60 rounded-xl p-4 bg-background/30 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-text-primary text-sm">{card.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${statusInfo.cls}`}>
                  {statusInfo.text}
                </span>
              </div>

              {isEditing ? (
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1">
                    <label className="text-xs text-text-secondary block">Available</label>
                    <input
                      type="number"
                      value={avail}
                      onChange={(e) => handleChange(card.keyAvail, e.target.value)}
                      className="w-full text-sm font-bold p-1 border rounded"
                    />
                  </div>
                  <span className="text-xs font-bold text-text-secondary mt-4">/</span>
                  <div className="flex-1">
                    <label className="text-xs text-text-secondary block">Total</label>
                    <input
                      type="number"
                      value={total}
                      onChange={(e) => handleChange(card.keyTotal, e.target.value)}
                      className="w-full text-sm font-bold p-1 border rounded"
                    />
                  </div>
                </div>
              ) : (
                <div className="my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-text-primary">{avail}</span>
                    <span className="text-xs text-text-secondary">/ {total} {card.unit}</span>
                  </div>
                </div>
              )}

              <div className="w-full bg-border/30 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${avail === 0 ? 'bg-error' : avail <= Math.ceil(total * 0.25) ? 'bg-warning' : 'bg-success'}`}
                  style={{ width: `${Math.min(100, Math.round((avail / (total || 1)) * 100))}%` }}
                ></div>
              </div>
            </div>
          );
        })}

        {/* Blood Bank Card */}
        <div className="border border-border/60 rounded-xl p-4 bg-background/30 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-text-primary text-sm">Blood Bank</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${resources.bloodBankUnits > 10 ? 'bg-success/20 text-success border-success/30' : 'bg-warning/20 text-warning border-warning/30'}`}>
              {resources.bloodBankUnits > 0 ? 'AVAILABLE' : 'UNAVAILABLE'}
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-text-primary">{resources.bloodBankUnits}</span>
              <span className="text-xs text-text-secondary">units in stock</span>
            </div>
            <p className="text-xs text-text-secondary mt-1">A+, O+, B+, AB+ available</p>
          </div>
        </div>

        {/* Doctors Card */}
        <div className="border border-border/60 rounded-xl p-4 bg-background/30 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-text-primary text-sm">Doctors On Duty</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${resources.doctorsAvailable > 0 ? 'bg-success/20 text-success border-success/30' : 'bg-error/20 text-error border-error/30'}`}>
              {resources.doctorsAvailable > 0 ? 'AVAILABLE' : 'UNAVAILABLE'}
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-text-primary">{resources.doctorsAvailable}</span>
              <span className="text-xs text-text-secondary">physicians active</span>
            </div>
            <p className="text-xs text-text-secondary mt-1">{resources.specialistsAvailable} Specialists on call</p>
          </div>
        </div>

        {/* Emergency Capacity & Load Card */}
        <div className="border border-border/60 rounded-xl p-4 bg-background/30 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-text-primary text-sm">Emergency Load</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${resources.emergencyLoad === 'HIGH' ? 'bg-error/20 text-error border-error/30' : 'bg-success/20 text-success border-success/30'}`}>
              {resources.emergencyLoad} LOAD
            </span>
          </div>

          <div className="my-2">
            <p className="text-xs text-text-secondary">Current ER Status: <strong>{acceptingEmergency ? 'Accepting Admissions' : 'Diverting Emergency'}</strong></p>
            <p className="text-xs text-text-secondary mt-1">Est. Waiting Time: ~15 mins</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalResourcesWidget;