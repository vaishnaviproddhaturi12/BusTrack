const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: String,
    required: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true
  },
  morning: {
    type: Boolean,
    default: false
  },
  evening: {
    type: Boolean,
    default: false
  },
  morningTime: {
    type: Date,
    default: null
  },
  eveningTime: {
    type: Date,
    default: null
  },
  location: {
    lat: Number,
    lng: Number
  },
  status: {
    type: String,
    enum: ["present", "absent", "late"],
    default: "present"
  }
}, { timestamps: true });

attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);