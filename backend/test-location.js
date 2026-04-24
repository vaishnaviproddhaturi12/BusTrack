// Test script to simulate driver location updates
const mongoose = require("mongoose");
const Bus = require("./models/Bus");

async function simulateDriverLocation() {
  try {
    await mongoose.connect("mongodb://bususer:Kannayya123@ac-wvzpwgx-shard-00-00.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-01.25dirsd.mongodb.net:27017,ac-wvzpwgx-shard-00-02.25dirsd.mongodb.net:27017/bustrack?ssl=true&replicaSet=atlas-p0lp50-shard-0&authSource=admin&retryWrites=true&w=majority");

    // Get first bus
    const bus = await Bus.findOne();
    if (!bus) {
      console.log("No buses found");
      return;
    }

    console.log(`Simulating location updates for bus: ${bus.busNumber}`);

    // Simulate movement along a route (Hyderabad coordinates)
    const locations = [
      { lat: 17.3850, lng: 78.4867 }, // Starting point
      { lat: 17.3870, lng: 78.4880 }, // Moving
      { lat: 17.3890, lng: 78.4895 }, // Moving
      { lat: 17.3910, lng: 78.4910 }, // Moving
      { lat: 17.3930, lng: 78.4925 }, // Moving
    ];

    for (let i = 0; i < locations.length; i++) {
      bus.location = locations[i];
      await bus.save();
      console.log(`Updated location: ${locations[i].lat}, ${locations[i].lng}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }

    console.log("Location simulation complete");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

simulateDriverLocation();