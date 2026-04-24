const express = require("express");
const router = express.Router();
const Bus = require("../models/Bus");
const User = require("../models/User");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

const getAssignedBusId = (user) => {
  if (!user.busId) return null;
  return user.busId._id ? user.busId._id.toString() : user.busId.toString();
};

// Helper function to check if bus is late and create notifications
const checkAndNotifyBusDelay = async (busId, bus) => {
  try {
    // Parse start time
    const [time, period] = bus.startTime.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hour, minutes, 0, 0);

    const delayMinutes = Math.round((now - scheduledTime) / (1000 * 60));

    console.log(`🚌 [${bus.busNumber}] Delay Check:`, {
      scheduledTime: scheduledTime.toLocaleTimeString(),
      currentTime: now.toLocaleTimeString(),
      delayMinutes
    });

    // Only notify if bus is more than 10 minutes late
    if (delayMinutes > 10) {
      console.log(`⏰ [${bus.busNumber}] Bus is ${delayMinutes} minutes late! Creating notifications...`);
      
      // Find students assigned to this bus
      const students = await User.find({ busId, role: 'student' });
      console.log(`👥 Found ${students.length} students assigned to ${bus.busNumber}`);

      // Check if notification already exists for today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      for (const student of students) {
        const existingNotification = await Notification.findOne({
          userId: student._id,
          busId,
          type: 'bus_late',
          createdAt: { $gte: todayStart }
        });

        // Only create notification if one doesn't exist for this bus today
        if (!existingNotification) {
          const notification = new Notification({
            userId: student._id,
            busId,
            type: 'bus_late',
            title: `${bus.busNumber} Running Late`,
            message: `Your bus ${bus.busNumber} is ${delayMinutes} minutes late. Please wait.`,
            delayMinutes
          });
          await notification.save();
          console.log(`📬 Notification sent to student ${student.name}`);
        } else {
          console.log(`📭 Notification already exists for ${student.name} today`);
        }
      }
    } else {
      console.log(`✅ [${bus.busNumber}] Bus is on time (${Math.abs(delayMinutes)} mins early)`);
    }
  } catch (error) {
    console.error('Error checking bus delay:', error);
  }
};

// 🚍 POST → Driver updates location for their assigned bus
router.post("/location/:id", authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    // Only drivers can update location
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: "Only drivers can update bus location" });
    }

    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    const assignedBusId = getAssignedBusId(req.user);
    if (assignedBusId && assignedBusId !== req.params.id) {
      return res.status(403).json({ message: "You can only update your assigned bus location" });
    }

    bus.location = { lat, lng };
    await bus.save();

    res.json({
      message: "Location updated",
      location: bus.location
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚍 POST → Driver updates location using their logged-in assigned bus
router.post("/location", authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: "Only drivers can update bus location" });
    }

    const assignedBusId = getAssignedBusId(req.user);
    if (!assignedBusId) {
      return res.status(404).json({ message: "No bus assigned to this driver" });
    }

    const bus = await Bus.findById(assignedBusId);
    if (!bus) {
      return res.status(404).json({ message: "Assigned bus not found" });
    }

    bus.location = { lat, lng };
    await bus.save();

    // Check if bus is late and notify students
    await checkAndNotifyBusDelay(assignedBusId, bus);

    res.json({
      message: "Location updated",
      location: bus.location
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📍 GET → Student gets location (only for their assigned bus)
router.get("/location/:id", authMiddleware, async (req, res) => {
  try {
    // Only students can view bus locations
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: "Only students can view bus locations" });
    }

    // Check if student is assigned to this bus
    const assignedBusId = getAssignedBusId(req.user);
    if (!assignedBusId || assignedBusId !== req.params.id) {
      return res.status(403).json({ message: "You can only view your assigned bus location" });
    }

    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.json(bus.location);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📋 GET → Get all buses
router.get("/all", async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🛣️ GET → Get bus routes
router.get("/routes", async (req, res) => {
  try {
    const buses = await Bus.find();
    const routes = buses.map(bus => ({
      id: bus._id,
      name: bus.route,
      stops: bus.stops || [],
      distance: bus.distance || 'N/A'
    }));
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ⏰ GET → Get bus timings
router.get("/timings", async (req, res) => {
  try {
    const buses = await Bus.find();
    const timings = buses.map(bus => ({
      id: bus._id,
      route: bus.route,
      schedule: bus.schedule || []
    }));
    res.json(timings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📞 GET → Get bus contacts
router.get("/contacts", async (req, res) => {
  try {
    const buses = await Bus.find();
    const contacts = buses.map(bus => ({
      id: bus._id,
      busNumber: bus.busNumber,
      driver: bus.driver || { name: 'N/A', phone: 'N/A' },
      incharge: bus.incharge || { name: 'N/A', phone: 'N/A' }
    }));
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👤 GET → Get current user's assigned bus
router.get("/my-bus", authMiddleware, async (req, res) => {
  try {
    if (!['student', 'driver'].includes(req.user.role)) {
      return res.status(403).json({ message: "Only students and drivers can access their bus information" });
    }

    const assignedBusId = getAssignedBusId(req.user);
    if (!assignedBusId) {
      return res.status(404).json({ message: "No bus assigned to this account" });
    }

    const bus = await Bus.findById(assignedBusId);
    if (!bus) {
      return res.status(404).json({ message: "Assigned bus not found" });
    }

    res.json({
      id: bus._id,
      busNumber: bus.busNumber,
      route: bus.route,
      location: bus.location,
      stops: bus.stops,
      distance: bus.distance,
      schedule: bus.schedule,
      driver: bus.driver,
      incharge: bus.incharge
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
