const mongoose = require("mongoose");
const User = require("./models/User");
const Bus = require("./models/Bus");

async function checkUsers() {
  try {
    await mongoose.connect("mongodb://bususer:Kannayya123@ac-wvzpwgx-shard-00-00.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-01.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-02.25dirsd.mongodb.net:27017/bustrack?ssl=true&replicaSet=atlas-p0lp50-shard-0&authSource=admin&retryWrites=true&w=majority");

    const users = await User.find({}).populate('busId');
    console.log('All users:');
    users.forEach(u => {
      console.log(`${u.name}: ${u.email} - Role: ${u.role} - Bus: ${u.busId ? u.busId.busNumber : 'None'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkUsers();