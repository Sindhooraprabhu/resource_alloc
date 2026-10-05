const Hospital = require('../models/Hospital');
const Ambulance = require('../models/Ambulance');
const User = require('../models/User');
const { seedHospitals } = require('./hospitalSeeder');

const ensureUser = async (data) => {
  let user = await User.findOne({ email: data.email });
  if (!user) user = await User.create(data);
  return user;
};

const seedOperationalResources = async () => {
  await seedHospitals();
  const hospitals = await Hospital.find({ status: { $in: ['operational', 'emergency_only'] } }).sort({ code: 1 });
  if (!hospitals.length) return;

  await ensureUser({
    name: 'LifeLink Administrator',
    email: 'admin@lifelink.com',
    password: 'admin123',
    role: 'admin',
    isActive: true,
    isVerified: true
  });

  const driverSeeds = [
    ['driver.kmc@lifelink.com', 'Mangalore Ambulance Driver 01', [74.8427, 12.8631]],
    ['driver.fmm@lifelink.com', 'Mangalore Ambulance Driver 02', [74.8562, 12.8687]],
    ['driver.aj@lifelink.com', 'Mangalore Ambulance Driver 03', [74.8398, 12.8983]],
    ['driver.ind@lifelink.com', 'Mangalore Ambulance Driver 04', [74.8672, 12.8624]]
  ];

  for (let index = 0; index < driverSeeds.length; index += 1) {
    const [email, name, coordinates] = driverSeeds[index];
    const driver = await ensureUser({
      name,
      email,
      password: 'change-me-ambulance',
      phone: `+9198765432${10 + index}`,
      role: 'ambulance',
      isActive: true,
      isVerified: true,
      ambulanceInfo: { vehicleNumber: `KA-19-AMB-${String(index + 1).padStart(2, '0')}`, vehicleType: index === 0 ? 'ALS' : 'BLS', baseLocation: 'Mangalore' }
    });

    const vehicleNumber = `KA-19-AMB-${String(index + 1).padStart(2, '0')}`;
    const exists = await Ambulance.findOne({ vehicleNumber });
    if (!exists) {
      await Ambulance.create({
        vehicleNumber,
        licenseNumber: `KA19-LIFE-${String(index + 1).padStart(4, '0')}`,
        vehicleType: index === 0 ? 'ALS' : 'BLS',
        baseLocation: { type: 'Point', coordinates },
        currentLocation: { type: 'Point', coordinates },
        status: 'available',
        capacity: { patients: 2, equipment: { ventilator: index === 0, defibrillator: true, ecgMonitor: true, oxygenSupply: true } },
        crew: { driver: driver._id }
      });
    }
  }

  const doctorSeeds = [
    ['doctor.cardiology@lifelink.com', 'Dr. Mangalore Cardiology', 'Cardiologist'],
    ['doctor.emergency@lifelink.com', 'Dr. Mangalore Emergency', 'Emergency physician'],
    ['doctor.trauma@lifelink.com', 'Dr. Mangalore Trauma', 'Orthopedic specialist'],
    ['doctor.pulmonary@lifelink.com', 'Dr. Mangalore Pulmonary', 'Pulmonologist']
  ];

  for (let index = 0; index < doctorSeeds.length; index += 1) {
    const [email, name, specialization] = doctorSeeds[index];
    const hospital = hospitals[index % hospitals.length];
    await ensureUser({
      name,
      email,
      password: 'change-me-doctor',
      phone: `+9198765442${10 + index}`,
      role: 'doctor',
      isActive: true,
      isVerified: true,
      doctorInfo: {
        specialization,
        licenseNumber: `KA-MED-${String(index + 1).padStart(4, '0')}`,
        experienceYears: 8 + index,
        hospitalId: hospital._id,
        availabilityStatus: 'available'
      }
    });
  }

  console.log(`Operational resources ready: ${hospitals.length} hospitals, ${await Ambulance.countDocuments()} ambulances, ${await User.countDocuments({ role: 'doctor', isActive: true })} doctors.`);
};

module.exports = { seedOperationalResources };
