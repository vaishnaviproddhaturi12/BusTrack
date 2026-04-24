const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const User = require('../models/User');

const router = express.Router();

// Get all notifications for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark a notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Clear all notifications for the user
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Error clearing notifications' });
  }
});

// Internal endpoint: Create a notification for a user (for backend use)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { userId, busId, type, title, message, delayMinutes } = req.body;

    const notification = new Notification({
      userId,
      busId,
      type,
      title,
      message,
      delayMinutes
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Error creating notification' });
  }
});

// Create bus late notification for a specific bus
// This would be called by the driver tracking system
router.post('/bus-late/:busId', authMiddleware, async (req, res) => {
  try {
    const { busId } = req.params;
    const { delayMinutes } = req.body;

    // Find all students assigned to this bus
    const students = await User.find({ busId, role: 'student' });

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found for this bus' });
    }

    // Create notifications for each student
    const notifications = [];
    for (const student of students) {
      const notification = new Notification({
        userId: student._id,
        busId,
        type: 'bus_late',
        title: 'Bus Delayed',
        message: `Your bus is running ${delayMinutes} minutes late. Please wait.`,
        delayMinutes
      });
      notifications.push(notification);
      await notification.save();
    }

    res.status(201).json({ message: `Notifications sent to ${notifications.length} students` });
  } catch (error) {
    console.error('Error creating bus late notification:', error);
    res.status(500).json({ message: 'Error creating notification' });
  }
});

// Create traffic delay notification for a specific bus
router.post('/traffic-delay/:busId', authMiddleware, async (req, res) => {
  try {
    const { busId } = req.params;
    const { delayMinutes, currentSpeed } = req.body;

    // Find all students assigned to this bus
    const students = await User.find({ busId, role: 'student' });

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found for this bus' });
    }

    // Check if traffic notification already exists for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existingTrafficNotification = await Notification.findOne({
      busId,
      type: 'traffic_delay',
      createdAt: { $gte: todayStart }
    });

    if (existingTrafficNotification) {
      // Update existing notification with new delay estimate
      existingTrafficNotification.message = `Your bus is experiencing traffic delays. Current speed: ${currentSpeed} km/h. Estimated delay: ${delayMinutes} minutes.`;
      existingTrafficNotification.delayMinutes = delayMinutes;
      await existingTrafficNotification.save();
      return res.json({ message: 'Traffic delay notification updated' });
    }

    // Create new traffic delay notifications for each student
    const notifications = [];
    for (const student of students) {
      const notification = new Notification({
        userId: student._id,
        busId,
        type: 'traffic_delay',
        title: 'Traffic Delay Alert',
        message: `Your bus is experiencing traffic delays. Current speed: ${currentSpeed} km/h. Estimated delay: ${delayMinutes} minutes.`,
        delayMinutes
      });
      notifications.push(notification);
      await notification.save();
    }

    res.status(201).json({ message: `Traffic delay notifications sent to ${notifications.length} students` });
  } catch (error) {
    console.error('Error creating traffic delay notification:', error);
    res.status(500).json({ message: 'Error creating notification' });
  }
});

module.exports = router;
