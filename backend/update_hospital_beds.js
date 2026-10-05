const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/lifelink_ai').then(async () => {
  const Hospital = require('./src/models/Hospital');
  
  // Update all hospitals with realistic bed availability
  const updates = [
    { name: 'KMC Hospital Attavar', icu: 8, emergency: 6, general: 50 },
    { name: 'KMC Hospital Jyothi', icu: 5, emergency: 4, general: 40 },
    { name: 'A.J. Hospital & Research Centre', icu: 10, emergency: 8, general: 60 },
    { name: 'Father Muller Medical College Hospital', icu: 15, emergency: 10, general: 80 },
    { name: 'Yenepoya Medical College Hospital', icu: 12, emergency: 8, general: 70 },
    { name: 'Indiana Hospital & Heart Institute', icu: 6, emergency: 5, general: 40 },
    { name: 'Unity Hospital', icu: 4, emergency: 3, general: 30 },
    { name: 'Highland Hospital', icu: 3, emergency: 2, general: 20 },
    { name: 'Srinivas Hospital', icu: 6, emergency: 4, general: 45 },
    { name: 'Mangala Hospital', icu: 2, emergency: 2, general: 25 },
  ];
  
  for (const u of updates) {
    await Hospital.findOneAndUpdate(
      { name: u.name },
      {
        $set: {
          'resources.beds.icuAvailable': u.icu,
          'resources.beds.icuReserved': 0,
          'resources.beds.emergencyAvailable': u.emergency,
          'resources.beds.emergencyReserved': 0,
          'resources.beds.available': u.general,
          'resources.beds.occupied': 0,
        }
      }
    );
    console.log(`Updated ${u.name}: ICU=${u.icu}, Emergency=${u.emergency}, General=${u.general}`);
  }
  
  console.log('Done!');
  process.exit(0);
});