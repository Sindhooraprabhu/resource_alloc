const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/lifelink_ai').then(async () => {
  const Ambulance = require('./src/models/Ambulance');
  const ambulances = await Ambulance.find({}, 'vehicleNumber status currentAssignment');
  console.log('Before reset:');
  ambulances.forEach(a => console.log(a.vehicleNumber, '|', a.status, '|', a.currentAssignment));
  
  await Ambulance.updateMany({}, { $set: { status: 'available' }, $unset: { currentAssignment: 1 } });
  
  const ambulances2 = await Ambulance.find({}, 'vehicleNumber status currentAssignment');
  console.log('After reset:');
  ambulances2.forEach(a => console.log(a.vehicleNumber, '|', a.status, '|', a.currentAssignment));
  process.exit(0);
});