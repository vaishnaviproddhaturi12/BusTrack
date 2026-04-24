const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Bus = require('./models/Bus');

const MONGO_URI = 'mongodb://bususer:Kannayya123@ac-wvzpwgx-shard-00-00.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-01.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-02.25dirsd.mongodb.net:27017/bustrack?ssl=true&replicaSet=atlas-p0lp50-shard-0&authSource=admin&retryWrites=true&w=majority';

async function createDriver() {
  try {
    await mongoose.connect(MONGO_URI);
    const email = 'driver1@bustrack.edu';
    const assignedBus = await Bus.findOne();

    if (!assignedBus) {
      console.log('No bus found. Run seed.js before creating a driver.');
      process.exit(1);
    }

    let user = await User.findOne({ email });
    if (user) {
      if (!user.busId) {
        user.busId = assignedBus._id;
        await user.save();
      }

      console.log('Driver account already exists:');
      console.log(`${user.name} | ${user.email} | role=${user.role} | bus=${assignedBus.busNumber}`);
      process.exit(0);
    }

    const hashed = await bcrypt.hash('driver1234', 10);
    user = new User({
      name: 'Driver One',
      email,
      password: hashed,
      role: 'driver',
      busId: assignedBus._id
    });
    await user.save();
    console.log('Created driver account:');
    console.log(`Email: ${email}`);
    console.log('Password: driver1234');
    console.log(`Assigned Bus: ${assignedBus.busNumber}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating driver:', error);
    process.exit(1);
  }
}

createDriver();
