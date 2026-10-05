import React, { useState, useEffect } from 'react';
import patientService from '../../services/patientService';

const DEMO_PATIENT = {
  id: 1,
  name: 'Priya Sharma',
  age: 34,
  gender: 'Female',
  mrn: 'KMC-2026-001234',
  bloodGroup: 'B+',
  allergies: ['Penicillin', 'Shellfish'],
  conditions: ['Hypertension', 'Diabetes Type 2'],
  medications: ['Metformin 500mg OD', 'Amlodipine 5mg OD'],
  lastVisit: '2026-01-10',
  primaryPhysician: 'Dr. Anjali Reddy',
  emergencyContacts: [
    { name: 'Rahul Sharma', relation: 'Husband', phone: '+91 98765 43210' },
    { name: 'Sunita Sharma', relation: 'Mother', phone: '+91 98765 43211' }
  ]
};

const DEMO_VISITS = [
  {
    date: '2026-01-10',
    type: 'Follow-up',
    doctor: 'Dr. Anjali Reddy',
    notes: 'Routine checkup. BP controlled. HbA1c 7.2%. Advised lifestyle modifications.',
    prescriptions: ['Metformin continued', 'Amlodipine continued']
  },
  {
    date: '2025-12-15',
    type: 'Consultation',
    doctor: 'Dr. Vikram Singh',
    notes: 'Chest pain evaluation. ECG normal. Stress test advised.',
    prescriptions: ['Atorvastatin 10mg HS']
  },
  {
    date: '2025-11-20',
    type: 'Lab Results',
    doctor: 'Dr. Meera Joshi',
    notes: 'HbA1c 7.5%, LDL 130 mg/dL. Advised dietary changes and exercise.',
    prescriptions: []
  }
];

const PatientHistoryWidget = () => {
  const [patient, setPatient] = useState(DEMO_PATIENT);
  const [visits, setVisits] = useState(DEMO_VISITS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const data = await patientService.getPatients();
        const list = Array.isArray(data) ? data : (data.data || data.patients || []);
        if (list.length > 0) {
          const p = list[0];
          setPatient({
            id: p._id || p.id,
            name: p.name || 'Unknown Patient',
            age: p.age || 'N/A',
            gender: p.gender || 'N/A',
            mrn: p.mrn || p.medicalRecordNumber || 'N/A',
            bloodGroup: p.bloodGroup || 'N/A',
            allergies: p.allergies || [],
            conditions: p.conditions || p.medicalConditions || [],
            medications: p.medications || p.currentMedications || [],
            lastVisit: p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'N/A',
            primaryPhysician: p.primaryPhysician || p.physician || 'N/A',
            emergencyContacts: p.emergencyContacts || []
          });

          // Try to fetch visit history
          if (p._id || p.id) {
            try {
              const histData = await patientService.getPatientHistory(p._id || p.id);
              const histList = Array.isArray(histData) ? histData : (histData.data || histData.visits || []);
              if (histList.length) setVisits(histList);
            } catch {
              // Keep demo visits
            }
          }
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch patient history:', err);
        setError('Unable to load patient history');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, []);

  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-lg font-semibold text-text-primary">Patient History</h2>
        <button className="btn-outline btn-sm p-2">
          Export Records
        </button>
      </div>

      <div className="space-y-6">
        {/* Patient Info */}
        <div className="bg-surface rounded-lg p-4 border border-border/50">
          <h3 className="font-medium text-text-primary mb-3">Patient Information</h3>
          <div className="grid grid-cols-2 gap-4 text-text-sm">
            <div>
              <p className="text-text-secondary">Name:</p>
              <p className="font-medium">{patient.name}</p>
            </div>
            <div>
              <p className="text-text-secondary">Age/Gender:</p>
              <p className="font-medium">{patient.age} • {patient.gender}</p>
            </div>
            <div>
              <p className="text-text-secondary">MRN:</p>
              <p className="font-medium">{patient.mrn}</p>
            </div>
            <div>
              <p className="text-text-secondary">Blood Group:</p>
              <p className="font-medium">{patient.bloodGroup}</p>
            </div>
            <div>
              <p className="text-text-secondary">Allergies:</p>
              <p className="font-medium">{patient.allergies.join(', ')}</p>
            </div>
            <div>
              <p className="text-text-secondary">Conditions:</p>
              <p className="font-medium">{patient.conditions.join(', ')}</p>
            </div>
            <div>
              <p className="text-text-secondary">Current Medications:</p>
              <p className="font-medium">{patient.medications.join(', ')}</p>
            </div>
            <div>
              <p className="text-text-secondary">Last Visit:</p>
              <p className="font-medium">{patient.lastVisit}</p>
            </div>
            <div>
              <p className="text-text-secondary">Primary Physician:</p>
              <p className="font-medium">{patient.primaryPhysician}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-surface rounded-lg p-4 border border-border/50">
          <h3 className="font-medium text-text-primary mb-3">Emergency Contacts</h3>
          <div className="space-y-3">
            {patient.emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div>
                  <h4 className="font-medium text-text-primary">{contact.name}</h4>
                  <p className="text-text-sm text-text-secondary">{contact.relation}</p>
                </div>
                <div className="text-text-sm font-medium">
                  {contact.phone}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visit History */}
        <div className="bg-surface rounded-lg p-4 border border-border/50">
          <h3 className="font-medium text-text-primary mb-3">Visit History</h3>
          <div className="space-y-4">
            {visits.map((visit, index) => (
              <div key={index} className="border-t border-border/50 pt-4 first:border-t-0">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium text-text-primary">{visit.type}</h4>
                  <p className="text-text-xs text-text-secondary">{visit.date}</p>
                </div>
                <p className="text-text-sm">{visit.notes}</p>
                {visit.prescriptions.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-text-sm mb-1">Prescriptions:</p>
                    <p className="text-text-sm">{visit.prescriptions.join(', ')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryWidget;