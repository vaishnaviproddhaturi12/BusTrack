const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true
  },
  route: {
    type: String,
    required: true
  },
  location: {
    lat: Number,
    lng: Number
  },
  stops: [String],
  distance: String,
  schedule: [{
    time: String,
    direction: String
  }],
  driver: {
    name: String,
    phone: String
  },
  incharge: {
    name: String,
    phone: String
  },
  startTime: {
    type: String,
    required: true
  },
  // Legacy fields for backward compatibility
  name: String,
  startPoint: String,
  endPoint: String,
  timing: String,
  driverPhone: String
});

module.exports = mongoose.model("Bus", busSchema);