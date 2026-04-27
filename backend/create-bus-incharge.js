const mongoose = require("mongoose");
const User = require("./models/User");
const Bus = require("./models/Bus");
const bcrypt = require("bcryptjs");

async function createBusIncharge() {
  try {
    await mongoose.connect("mongodb://bususer:Kannayya123@ac-wvzpwgx-shard-00-00.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-01.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-02.25dirsd.mongodb.net:27017/bustrack?ssl=true&replicaSet=atlas-p0lp50-shard-0&authSource=admin&retryWrites=true&w=majority");

    // Get bus IDs to assign
    const buses = await Bus.find({});
    console.log('Available buses:');
    buses.forEach(b => console.log(`  - ${b.busNumber}: ${b._id}`));

    if (process.argv.length < 4) {
      console.log('\nUsage: node create-bus-incharge.js <name> <email> <password> [busIds...]');
      console.log('\nExample: node create-bus-incharge.js "John Incharge" "john@incharge.com" "password123" "busId1" "busId2"');
      process.exit(0);
    }

    const name = process.argv[2];
    const email = process.argv[3];
    const password = process.argv[4];
    const busIds = process.argv.slice(5);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create bus incharge user
    const incharge = new User({
      name,
      email,
      password: hashedPassword,
      role: 'busIncharge',
      assignedBuses: busIds
    });

    await incharge.save();
    console.log(`\n✅ Bus Incharge created successfully!`);
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Assigned Buses: ${busIds.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

createBusIncharge();