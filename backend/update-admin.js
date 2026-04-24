const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

async function updateAdminPassword() {
  try {
    await mongoose.connect("mongodb://bususer:Kannayya123@ac-wvzpwgx-shard-00-00.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-01.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-02.25dirsd.mongodb.net:27017/bustrack?ssl=true&replicaSet=atlas-p0lp50-shard-0&authSource=admin&retryWrites=true&w=majority");

    const hashedPassword = await bcrypt.hash("password123", 10);
    
    // Find admin and update password
    const admin = await User.findOne({ email: "admin@bustrack.edu" });
    
    if (admin) {
      admin.password = hashedPassword;
      await admin.save();
      console.log("✅ Admin password updated to: password123");
    } else {
      // Create admin if doesn't exist
      const newAdmin = new User({
        name: "Admin",
        email: "admin@bustrack.edu",
        password: hashedPassword,
        role: "admin",
        busId: null
      });
      await newAdmin.save();
      console.log("✅ Admin created with password: password123");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updateAdminPassword();