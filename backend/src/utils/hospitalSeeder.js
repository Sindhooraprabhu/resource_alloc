const Hospital = require('../models/Hospital');

// Initial seed data for Mangalore hospitals
const seedHospitals = async () => {
  const count = await Hospital.countDocuments();
  if (count > 0) return;

  const demoHospitals = [
    {
      name: 'KMC Hospital Attavar',
      code: 'KMC-ATT',
      hospitalType: 'Super Specialty',
      location: { type: 'Point', coordinates: [74.8427, 12.8631] }, // [long, lat]
      address: { street: 'Attavar Road', city: 'Mangalore', state: 'Karnataka', pincode: '575001' },
      area: 'Attavar',
      contact: { phone: '+91 824 242 4242', emergency: '+91 824 242 4243', email: 'info.attavar@kmchospitals.com' },
      emergencyDepartmentAvailable: true,
      status: 'operational',
      currentLoad: 45,
      details: {
        establishedYear: 1992,
        bedCapacity: { total: 200, icu: 25, general: 150 },
        equipment: { ventilators: 15, operationTheatres: 5, bloodBank: true }
      },
      departments: ['Emergency', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'OB-GYN', 'Emergency Medicine', 'General Surgery', 'Neurosurgery', 'Anesthesiology'],
      specialists: ['Cardiologist', 'Neurologist', 'Orthopedic specialist', 'Neurosurgeon', 'General surgeon', 'Emergency physician', 'Pediatrician', 'Anesthesiologist'],
      resources: {
        beds: { total: 200, available: 45, occupied: 155, icuTotal: 25, icuAvailable: 8, icuReserved: 0, emergencyTotal: 15, emergencyAvailable: 6, emergencyReserved: 0 },
        equipment: { ventilatorsTotal: 15, ventilatorsAvailable: 5, ventilatorsReserved: 0, ecgMachinesTotal: 8, ecgMachinesAvailable: 4, oxygenAvailable: 'AVAILABLE', operationTheatresTotal: 5, operationTheatresAvailable: 2, operationTheatresReserved: 0, emergencyEquipment: 'AVAILABLE' },
        blood: { ap: 15, am: 4, bp: 20, bm: 6, op: 25, om: 8, abp: 10, abm: 3 },
        staff: { doctorsAvailable: 22, emergencyDoctors: 5, specialistsAvailable: 8, nursesAvailable: 45, emergencyStaff: 12 },
        emergencyCapacity: { currentLoad: 'MODERATE', waitingPatients: 4, emergencyRoomCapacity: 15, estimatedWaitingTime: 20, acceptingEmergencyPatients: true }
      }
    },
    {
      name: 'KMC Hospital Jyothi',
      code: 'KMC-JYO',
      hospitalType: 'Super Specialty',
      location: { type: 'Point', coordinates: [74.8429, 12.8726] },
      address: { street: 'Light House Hill Road, Jyothi', city: 'Mangalore', state: 'Karnataka', pincode: '575001' },
      area: 'Jyothi',
      contact: { phone: '+91 824 221 1222', emergency: '+91 824 221 1223', email: 'info.jyothi@kmchospitals.com' },
      emergencyDepartmentAvailable: true,
      status: 'operational',
      currentLoad: 30,
      details: {
        establishedYear: 1953,
        bedCapacity: { total: 150, icu: 15, general: 110 },
        equipment: { ventilators: 10, operationTheatres: 4, bloodBank: true }
      },
      departments: ['Emergency', 'Pediatrics', 'OB-GYN', 'Cardiology', 'Neurology', 'Pulmonology', 'Anesthesiology'],
      specialists: ['Cardiologist', 'Neurologist', 'Emergency physician', 'Pediatrician', 'Pulmonologist', 'Anesthesiologist'],
      resources: {
        beds: { total: 150, available: 62, occupied: 88, icuTotal: 15, icuAvailable: 5, icuReserved: 0, emergencyTotal: 10, emergencyAvailable: 4, emergencyReserved: 0 },
        equipment: { ventilatorsTotal: 10, ventilatorsAvailable: 3, ventilatorsReserved: 0, ecgMachinesTotal: 6, ecgMachinesAvailable: 3, oxygenAvailable: 'AVAILABLE', operationTheatresTotal: 4, operationTheatresAvailable: 1, operationTheatresReserved: 0, emergencyEquipment: 'AVAILABLE' },
        blood: { ap: 12, am: 3, bp: 15, bm: 4, op: 18, om: 5, abp: 8, abm: 2 },
        staff: { doctorsAvailable: 18, emergencyDoctors: 4, specialistsAvailable: 6, nursesAvailable: 35, emergencyStaff: 10 },
        emergencyCapacity: { currentLoad: 'LOW', waitingPatients: 1, emergencyRoomCapacity: 10, estimatedWaitingTime: 10, acceptingEmergencyPatients: true }
      }
    },
    {
      name: 'A.J. Hospital & Research Centre',
      code: 'AJH-KUN',
      hospitalType: 'Super Specialty',
      location: { type: 'Point', coordinates: [74.8398, 12.8983] },
      address: { street: 'Kuntikan Road', city: 'Mangalore', state: 'Karnataka', pincode: '575004' },
      area: 'Kuntikan',
      contact: { phone: '+91 824 222 5533', emergency: '+91 824 222 5534', email: 'info@ajhospital.in' },
      emergencyDepartmentAvailable: true,
      status: 'operational',
      currentLoad: 80,
      details: {
        establishedYear: 2001,
        bedCapacity: { total: 250, icu: 30, general: 180 },
        equipment: { ventilators: 20, operationTheatres: 6, bloodBank: true }
      },
      departments: ['Emergency', 'Cardiology', 'Oncology', 'Nephrology', 'Neurology', 'Orthopedics', 'General Surgery', 'Neurosurgery', 'Anesthesiology'],
      specialists: ['Cardiologist', 'Neurologist', 'Orthopedic specialist', 'Neurosurgeon', 'General surgeon', 'Emergency physician', 'Anesthesiologist'],
      resources: {
        beds: { total: 250, available: 20, occupied: 230, icuTotal: 30, icuAvailable: 2, icuReserved: 0, emergencyTotal: 20, emergencyAvailable: 3, emergencyReserved: 0 },
        equipment: { ventilatorsTotal: 20, ventilatorsAvailable: 2, ventilatorsReserved: 0, ecgMachinesTotal: 12, ecgMachinesAvailable: 2, oxygenAvailable: 'LIMITED', operationTheatresTotal: 6, operationTheatresAvailable: 0, operationTheatresReserved: 0, emergencyEquipment: 'AVAILABLE' },
        blood: { ap: 8, am: 2, bp: 12, bm: 3, op: 10, om: 2, abp: 5, abm: 1 },
        staff: { doctorsAvailable: 35, emergencyDoctors: 8, specialistsAvailable: 12, nursesAvailable: 80, emergencyStaff: 24 },
        emergencyCapacity: { currentLoad: 'HIGH', waitingPatients: 12, emergencyRoomCapacity: 20, estimatedWaitingTime: 45, acceptingEmergencyPatients: true }
      }
    },
    {
      name: 'Father Muller Medical College Hospital',
      code: 'FMM-KAN',
      hospitalType: 'Super Specialty',
      location: { type: 'Point', coordinates: [74.8562, 12.8687] },
      address: { street: 'Father Muller Road, Kankanady', city: 'Mangalore', state: 'Karnataka', pincode: '575002' },
      area: 'Kankanady',
      contact: { phone: '+91 824 223 8000', emergency: '+91 824 223 8001', email: 'fathermullerhospital@fathermuller.in' },
      emergencyDepartmentAvailable: true,
      status: 'operational',
      currentLoad: 60,
      details: {
        establishedYear: 1880,
        bedCapacity: { total: 300, icu: 35, general: 220 },
        equipment: { ventilators: 25, operationTheatres: 8, bloodBank: true }
      },
      departments: ['Emergency', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'OB-GYN', 'General Surgery', 'Neurosurgery', 'Anesthesiology', 'Pulmonology'],
      specialists: ['Cardiologist', 'Neurologist', 'Orthopedic specialist', 'Neurosurgeon', 'General surgeon', 'Emergency physician', 'Pediatrician', 'Pulmonologist', 'Anesthesiologist'],
      resources: {
        beds: { total: 300, available: 85, occupied: 215, icuTotal: 35, icuAvailable: 11, icuReserved: 0, emergencyTotal: 25, emergencyAvailable: 7, emergencyReserved: 0 },
        equipment: { ventilatorsTotal: 25, ventilatorsAvailable: 8, ventilatorsReserved: 0, ecgMachinesTotal: 15, ecgMachinesAvailable: 6, oxygenAvailable: 'AVAILABLE', operationTheatresTotal: 8, operationTheatresAvailable: 3, operationTheatresReserved: 0, emergencyEquipment: 'AVAILABLE' },
        blood: { ap: 25, am: 8, bp: 28, bm: 9, op: 32, om: 12, abp: 14, abm: 4 },
        staff: { doctorsAvailable: 42, emergencyDoctors: 10, specialistsAvailable: 15, nursesAvailable: 110, emergencyStaff: 30 },
        emergencyCapacity: { currentLoad: 'MODERATE', waitingPatients: 5, emergencyRoomCapacity: 25, estimatedWaitingTime: 15, acceptingEmergencyPatients: true }
      }
    },
    {
      name: 'Yenepoya Medical College Hospital',
      code: 'YEP-DER',
      hospitalType: 'Super Specialty',
      location: { type: 'Point', coordinates: [74.8450, 12.8014] },
      address: { street: 'Deralakatte', city: 'Mangalore', state: 'Karnataka', pincode: '575018' },
      area: 'Deralakatte',
      contact: { phone: '+91 824 220 4668', emergency: '+91 824 220 4669', email: 'yenepoyahospital@yenepoya.edu.in' },
      emergencyDepartmentAvailable: true,
      status: 'operational',
      currentLoad: 50,
      details: {
        establishedYear: 1999,
        bedCapacity: { total: 220, icu: 20, general: 160 },
        equipment: { ventilators: 15, operationTheatres: 5, bloodBank: true }
      },
      departments: ['Emergency', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Surgery', 'Pulmonology', 'Anesthesiology'],
      specialists: ['Cardiologist', 'Neurologist', 'Orthopedic specialist', 'General surgeon', 'Emergency physician', 'Pediatrician', 'Pulmonologist', 'Anesthesiologist'],
      resources: {
        beds: { total: 220, available: 75, occupied: 145, icuTotal: 20, icuAvailable: 9, icuReserved: 0, emergencyTotal: 15, emergencyAvailable: 8, emergencyReserved: 0 },
        equipment: { ventilatorsTotal: 15, ventilatorsAvailable: 7, ventilatorsReserved: 0, ecgMachinesTotal: 10, ecgMachinesAvailable: 5, oxygenAvailable: 'AVAILABLE', operationTheatresTotal: 5, operationTheatresAvailable: 2, operationTheatresReserved: 0, emergencyEquipment: 'AVAILABLE' },
        blood: { ap: 18, am: 5, bp: 22, bm: 6, op: 20, om: 7, abp: 12, abm: 3 },
        staff: { doctorsAvailable: 25, emergencyDoctors: 6, specialistsAvailable: 10, nursesAvailable: 50, emergencyStaff: 15 },
        emergencyCapacity: { currentLoad: 'LOW', waitingPatients: 2, emergencyRoomCapacity: 15, estimatedWaitingTime: 10, acceptingEmergencyPatients: true }
      }
    },
    {
      name: 'Indiana Hospital & Heart Institute',
      code: 'IND-PUM',
      hospitalType: 'Super Specialty',
      location: { type: 'Point', coordinates: [74.8672, 12.8624] },
      address: { street: 'Mahaveer Circle, Pumpwell', city: 'Mangalore', state: 'Karnataka', pincode: '575007' },
      area: 'Pumpwell',
      contact: { phone: '+91 824 222 4111', emergency: '+91 824 222 4112', email: 'info@indianahospital.in' },
      emergencyDepartmentAvailable: true,
      status: 'operational',
      currentLoad: 40,
      details: {
        establishedYear: 2012,
        bedCapacity: { total: 120, icu: 15, general: 80 },
        equipment: { ventilators: 12, operationTheatres: 3, bloodBank: true }
      },
      departments: ['Emergency', 'Cardiology', 'Neurology', 'Pulmonology', 'Anesthesiology', 'General Surgery'],
      specialists: ['Cardiologist', 'Neurologist', 'General surgeon', 'Emergency physician', 'Pulmonologist', 'Anesthesiologist'],
      resources: {
        beds: { total: 120, available: 42, occupied: 78, icuTotal: 15, icuAvailable: 4, icuReserved: 0, emergencyTotal: 10, emergencyAvailable: 5, emergencyReserved: 0 },
        equipment: { ventilatorsTotal: 12, ventilatorsAvailable: 4, ventilatorsReserved: 0, ecgMachinesTotal: 8, ecgMachinesAvailable: 4, oxygenAvailable: 'AVAILABLE', operationTheatresTotal: 3, operationTheatresAvailable: 1, operationTheatresReserved: 0, emergencyEquipment: 'AVAILABLE' },
        blood: { ap: 10, am: 2, bp: 14, bm: 4, op: 15, om: 4, abp: 6, abm: 1 },
        staff: { doctorsAvailable: 15, emergencyDoctors: 4, specialistsAvailable: 7, nursesAvailable: 30, emergencyStaff: 10 },
        emergencyCapacity: { currentLoad: 'LOW', waitingPatients: 1, emergencyRoomCapacity: 10, estimatedWaitingTime: 8, acceptingEmergencyPatients: true }
      }
    },
    {
      name: 'Unity Hospital',
      code: 'UNT-HIG',
      hospitalType: 'General',
      location: { type: 'Point', coordinates: [74.8521, 12.8681] },
      address: { street: 'Highlands, Falnir', city: 'Mangalore', state: 'Karnataka', pincode: '575002' },
      area: 'Highlands',
      contact: { phone: '+91 824 242 8111', emergency: '+91 824 242 8112', email: 'info@unityhospital.com' },
      emergencyDepartmentAvailable: true,
      status: 'operational',
      currentLoad: 25,
      details: {
        establishedYear: 1978,
        bedCapacity: { total: 100, icu: 10, general: 70 },
        equipment: { ventilators: 6, operationTheatres: 3, bloodBank: false }
      },
      departments: ['Emergency', 'Orthopedics', 'Pediatrics', 'OB-GYN', 'General Surgery', 'Anesthesiology'],
      specialists: ['Orthopedic specialist', 'General surgeon', 'Emergency physician', 'Pediatrician', 'Anesthesiologist'],
      resources: {
        beds: { total: 100, available: 55, occupied: 45, icuTotal: 10, icuAvailable: 6, icuReserved: 0, emergencyTotal: 8, emergencyAvailable: 5, emergencyReserved: 0 },
        equipment: { ventilatorsTotal: 6, ventilatorsAvailable: 3, ventilatorsReserved: 0, ecgMachinesTotal: 4, ecgMachinesAvailable: 2, oxygenAvailable: 'AVAILABLE', operationTheatresTotal: 3, operationTheatresAvailable: 2, operationTheatresReserved: 0, emergencyEquipment: 'AVAILABLE' },
        blood: { ap: 0, am: 0, bp: 0, bm: 0, op: 0, om: 0, abp: 0, abm: 0 }, // no blood bank
        staff: { doctorsAvailable: 10, emergencyDoctors: 3, specialistsAvailable: 4, nursesAvailable: 25, emergencyStaff: 8 },
        emergencyCapacity: { currentLoad: 'LOW', waitingPatients: 0, emergencyRoomCapacity: 8, estimatedWaitingTime: 5, acceptingEmergencyPatients: true }
      }
    },
    {
      name: 'Highland Hospital',
      code: 'HLD-HIG',
      hospitalType: 'General',
      location: { type: 'Point', coordinates: [74.8505, 12.8675] },
      address: { street: 'Kankanady Bye Pass Road', city: 'Mangalore', state: 'Karnataka', pincode: '575002' },
      area: 'Highlands',
      contact: { phone: '+91 824 243 5311', emergency: '+91 824 243 5312', email: 'highlandhospital@gmail.com' },
      emergencyDepartmentAvailable: true,
      status: 'operational',
      currentLoad: 35,
      details: {
        establishedYear: 1995,
        bedCapacity: { total: 80, icu: 8, general: 60 },
        equipment: { ventilators: 5, operationTheatres: 2, bloodBank: false }
      },
      departments: ['Emergency', 'Orthopedics', 'OB-GYN', 'General Surgery', 'Pediatrics', 'Anesthesiology'],
      specialists: ['Orthopedic specialist', 'General surgeon', 'Emergency physician', 'Pediatrician', 'Anesthesiologist'],
      resources: {
        beds: { total: 80, available: 32, occupied: 48, icuTotal: 8, icuAvailable: 3, icuReserved: 0, emergencyTotal: 6, emergencyAvailable: 3, emergencyReserved: 0 },
        equipment: { ventilatorsTotal: 5, ventilatorsAvailable: 2, ventilatorsReserved: 0, ecgMachinesTotal: 3, ecgMachinesAvailable: 1, oxygenAvailable: 'AVAILABLE', operationTheatresTotal: 2, operationTheatresAvailable: 1, operationTheatresReserved: 0, emergencyEquipment: 'AVAILABLE' },
        blood: { ap: 0, am: 0, bp: 0, bm: 0, op: 0, om: 0, abp: 0, abm: 0 },
        staff: { doctorsAvailable: 8, emergencyDoctors: 2, specialistsAvailable: 4, nursesAvailable: 20, emergencyStaff: 6 },
        emergencyCapacity: { currentLoad: 'LOW', waitingPatients: 1, emergencyRoomCapacity: 6, estimatedWaitingTime: 12, acceptingEmergencyPatients: true }
      }
    },
    {
      name: 'Srinivas Hospital',
      code: 'SRI-MUK',
      hospitalType: 'Super Specialty',
      location: { type: 'Point', coordinates: [74.8401, 12.8805] }, // coordinates set closer to center for demo purposes
      address: { street: 'Mukka, Surathkal', city: 'Mangalore', state: 'Karnataka', pincode: '575021' },
      area: 'Mukka',
      contact: { phone: '+91 824 244 5861', emergency: '+91 824 244 5862', email: 'srinivashospital@srinivasgroup.com' },
      emergencyDepartmentAvailable: true,
      status: 'operational',
      currentLoad: 50,
      details: {
        establishedYear: 2011,
        bedCapacity: { total: 180, icu: 15, general: 130 },
        equipment: { ventilators: 10, operationTheatres: 4, bloodBank: true }
      },
      departments: ['Emergency', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Surgery', 'Anesthesiology'],
      specialists: ['Cardiologist', 'Neurologist', 'Orthopedic specialist', 'General surgeon', 'Emergency physician', 'Pediatrician', 'Anesthesiologist'],
      resources: {
        beds: { total: 180, available: 65, occupied: 115, icuTotal: 15, icuAvailable: 5, icuReserved: 0, emergencyTotal: 12, emergencyAvailable: 4, emergencyReserved: 0 },
        equipment: { ventilatorsTotal: 10, ventilatorsAvailable: 4, ventilatorsReserved: 0, ecgMachinesTotal: 6, ecgMachinesAvailable: 3, oxygenAvailable: 'AVAILABLE', operationTheatresTotal: 4, operationTheatresAvailable: 1, operationTheatresReserved: 0, emergencyEquipment: 'AVAILABLE' },
        blood: { ap: 10, am: 2, bp: 12, bm: 3, op: 15, om: 4, abp: 6, abm: 1 },
        staff: { doctorsAvailable: 16, emergencyDoctors: 4, specialistsAvailable: 7, nursesAvailable: 35, emergencyStaff: 10 },
        emergencyCapacity: { currentLoad: 'MODERATE', waitingPatients: 3, emergencyRoomCapacity: 12, estimatedWaitingTime: 15, acceptingEmergencyPatients: true }
      }
    },
    {
      name: 'Mangala Hospital',
      code: 'MNG-KAD',
      hospitalType: 'General',
      location: { type: 'Point', coordinates: [74.8492, 12.8718] },
      address: { street: 'Kadri Temple Road', city: 'Mangalore', state: 'Karnataka', pincode: '575003' },
      area: 'Kadri',
      contact: { phone: '+91 824 244 0465', emergency: '+91 824 244 0466', email: 'mangalaclinics@yahoo.com' },
      emergencyDepartmentAvailable: true,
      status: 'operational',
      currentLoad: 20,
      details: {
        establishedYear: 1988,
        bedCapacity: { total: 80, icu: 6, general: 60 },
        equipment: { ventilators: 4, operationTheatres: 2, bloodBank: false }
      },
      departments: ['Emergency', 'Orthopedics', 'Pediatrics', 'OB-GYN', 'General Surgery', 'Anesthesiology'],
      specialists: ['Orthopedic specialist', 'General surgeon', 'Emergency physician', 'Pediatrician', 'Anesthesiologist'],
      resources: {
        beds: { total: 80, available: 48, occupied: 32, icuTotal: 6, icuAvailable: 3, icuReserved: 0, emergencyTotal: 8, emergencyAvailable: 5, emergencyReserved: 0 },
        equipment: { ventilatorsTotal: 4, ventilatorsAvailable: 2, ventilatorsReserved: 0, ecgMachinesTotal: 4, ecgMachinesAvailable: 2, oxygenAvailable: 'AVAILABLE', operationTheatresTotal: 2, operationTheatresAvailable: 1, operationTheatresReserved: 0, emergencyEquipment: 'AVAILABLE' },
        blood: { ap: 0, am: 0, bp: 0, bm: 0, op: 0, om: 0, abp: 0, abm: 0 },
        staff: { doctorsAvailable: 8, emergencyDoctors: 3, specialistsAvailable: 4, nursesAvailable: 18, emergencyStaff: 8 },
        emergencyCapacity: { currentLoad: 'LOW', waitingPatients: 0, emergencyRoomCapacity: 8, estimatedWaitingTime: 5, acceptingEmergencyPatients: true }
      }
    }
  ];

  await Hospital.insertMany(demoHospitals);
  console.log('Successfully seeded 10 Mangalore hospitals in database.');
};

module.exports = {
  seedHospitals
};
