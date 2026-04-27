const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Bus = require('../models/Bus');
const authMiddleware = require('../middleware/authMiddleware');

const distanceInMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

const getReadableStudentId = (user) => {
  if (user.role === 'student') {
    return user._id;
  }

  if (user.role === 'parent' && user.studentId) {
    return user.studentId._id || user.studentId;
  }

  return null;
};

router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const { busId, qrData, latitude, longitude } = req.body;
    const studentId = req.user._id;

    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can mark attendance' });
    }

    if (!qrData || !qrData.busId) {
      return res.status(400).json({ message: 'Invalid QR code data' });
    }

    if (qrData.busId !== busId) {
      return res.status(400).json({ message: 'QR code does not match the bus' });
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'Location is required to mark attendance.' });
    }

    if (!bus.location || typeof bus.location.lat !== 'number' || typeof bus.location.lng !== 'number') {
      return res.status(400).json({ message: 'Bus location is not available right now. Please try again when the bus is live.' });
    }

    const dist = distanceInMeters(latitude, longitude, bus.location.lat, bus.location.lng);
    console.log(`Distance from bus: ${dist.toFixed(2)} meters`);

    if (dist > 200) {
      return res.status(400).json({
        message: 'You are not near the bus. Please scan the QR code inside the bus.',
        distance: dist
      });
    }

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeInMinutes = hours * 60 + minutes;

    const isMorningWindow = currentTimeInMinutes >= 420 && currentTimeInMinutes <= 540;
    const isEveningWindow = currentTimeInMinutes >= 945 && currentTimeInMinutes <= 1080;

    const today = getCurrentDate();
    let attendance = await Attendance.findOne({ studentId, date: today, busId });

    if (!attendance) {
      attendance = new Attendance({
        studentId,
        date: today,
        busId,
        location: { lat: latitude, lng: longitude }
      });
    }

    if (isMorningWindow) {
      if (attendance.morning) {
        return res.status(400).json({ message: 'Morning attendance already marked' });
      }
      attendance.morning = true;
      attendance.morningTime = now;
      console.log('Morning attendance recorded');
    } else if (isEveningWindow) {
      if (attendance.evening) {
        return res.status(400).json({ message: 'Evening attendance already marked' });
      }
      attendance.evening = true;
      attendance.eveningTime = now;
      console.log('Evening attendance recorded');
    } else {
      return res.status(400).json({
        message: 'Attendance can only be marked between 7:00 AM to 9:00 AM or 3:45 PM to 6:00 PM.'
      });
    }

    attendance.location = { lat: latitude, lng: longitude };

    await attendance.save();

    res.json({
      message: 'Attendance marked successfully',
      attendance: {
        date: attendance.date,
        morning: attendance.morning,
        evening: attendance.evening,
        morningTime: attendance.morningTime,
        eveningTime: attendance.eveningTime
      }
    });
  } catch (error) {
    console.error('Attendance scan error:', error);
    res.status(500).json({ message: 'Error recording attendance' });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const studentId = getReadableStudentId(req.user);

    if (!studentId) {
      return res.status(403).json({ message: 'Only students and linked parents can view attendance' });
    }

    const { startDate, endDate } = req.query;
    const query = { studentId };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.date = { $gte: thirtyDaysAgo.toISOString().split('T')[0] };
    }

    const attendance = await Attendance.find(query)
      .populate('busId', 'busNumber route')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

router.get('/student/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const readableStudentId = getReadableStudentId(req.user);
      if (!readableStudentId || readableStudentId.toString() !== req.params.id) {
        return res.status(403).json({ message: 'You can only view attendance for your linked student' });
      }
    }

    const { startDate, endDate } = req.query;
    const query = { studentId: req.params.id };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
      .populate('busId', 'busNumber route')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = getCurrentDate();
    const attendance = await Attendance.find({ date: today })
      .populate('studentId', 'name email')
      .populate('busId', 'busNumber route');

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

router.get('/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.date = { $gte: sevenDaysAgo.toISOString().split('T')[0] };
    }

    const attendance = await Attendance.find(query)
      .populate('studentId', 'name email')
      .populate('busId', 'busNumber route')
      .sort({ date: -1, studentId: 1 });

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching all attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

module.exports = router;
