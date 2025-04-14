const express = require('express');
const router = express.Router();
const Reminder = require('../models/reminder.model');

// Temporary mock middleware for testing without authentication
const tempAuthMiddleware = (req, res, next) => {
  // Hardcode a user ID for testing
  req.user = { id: '6444c0a6f28d9482c54d2992' }; // Replace with a valid ObjectId
  next();
};

// Apply temporary mock middleware instead of real auth
router.use(tempAuthMiddleware);

// --- Reminder Routes ---

// POST /api/reminders - Create a new reminder
router.post('/', async (req, res) => {
  try {
    const { medicationName, daysOfWeek, time, appNotification, whatsappAlert, phoneNumber, dosage, instructions } = req.body;
    const userId = req.user.id; // Get user ID from auth middleware

    if (!medicationName || !daysOfWeek || !time) {
      return res.status(400).json({ message: 'Medication name, days, and time are required' });
    }

    // Validate phone number if WhatsApp is enabled
    if (whatsappAlert && (!phoneNumber || !/^\+?[1-9]\d{9,14}$/.test(phoneNumber))) {
      return res.status(400).json({ message: 'A valid phone number is required for WhatsApp alerts' });
    }

    const newReminder = new Reminder({
      user: userId,
      medicationName,
      daysOfWeek,
      time,
      appNotification,
      whatsappAlert,
      phoneNumber,
      dosage,
      instructions,
      // isScheduled and scheduledJobId will be handled by the scheduler
    });

    await newReminder.save();
    // TODO: Add logic here or in a service to schedule the reminder job

    res.status(201).json(newReminder);
  } catch (error) {
    console.error("Error creating reminder:", error);
    res.status(500).json({ message: 'Failed to create reminder', error: error.message });
  }
});

// GET /api/reminders - Get all reminders for the logged-in user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const reminders = await Reminder.find({ user: userId }).sort({ createdAt: -1 }); // Sort by newest first
    res.status(200).json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ message: 'Failed to fetch reminders', error: error.message });
  }
});

// GET /api/reminders/:id - Get a specific reminder
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const reminder = await Reminder.findOne({ _id: req.params.id, user: userId });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    res.status(200).json(reminder);
  } catch (error) {
    console.error("Error fetching reminder:", error);
    // Handle potential CastError if ID format is invalid
    if (error.name === 'CastError') {
       return res.status(400).json({ message: 'Invalid reminder ID format' });
    }
    res.status(500).json({ message: 'Failed to fetch reminder', error: error.message });
  }
});

// PUT /api/reminders/:id - Update a reminder
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicationName, daysOfWeek, time, appNotification, whatsappAlert, phoneNumber, dosage, instructions } = req.body;

    // Basic validation
    if (!medicationName || !daysOfWeek || !time) {
      return res.status(400).json({ message: 'Medication name, days, and time are required' });
    }

    // Validate phone number if WhatsApp is enabled
    if (whatsappAlert && (!phoneNumber || !/^\+?[1-9]\d{9,14}$/.test(phoneNumber))) {
      return res.status(400).json({ message: 'A valid phone number is required for WhatsApp alerts' });
    }

    const updatedReminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { $set: { 
          medicationName, 
          daysOfWeek, 
          time, 
          appNotification, 
          whatsappAlert, 
          phoneNumber,
          dosage, 
          instructions, 
          isScheduled: false 
        } 
      }, // Mark as unscheduled on update
      { new: true, runValidators: true } // Return updated doc and run schema validators
    );

    if (!updatedReminder) {
      return res.status(404).json({ message: 'Reminder not found or user mismatch' });
    }

    // TODO: Add logic here or in a service to re-schedule the updated reminder job

    res.status(200).json(updatedReminder);
  } catch (error) {
    console.error("Error updating reminder:", error);
    if (error.name === 'CastError') {
       return res.status(400).json({ message: 'Invalid reminder ID format' });
    }
    res.status(500).json({ message: 'Failed to update reminder', error: error.message });
  }
});

// DELETE /api/reminders/:id - Delete a reminder
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const deletedReminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!deletedReminder) {
      return res.status(404).json({ message: 'Reminder not found or user mismatch' });
    }

    // TODO: Add logic here or in a service to cancel the scheduled job for this reminder

    res.status(200).json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error("Error deleting reminder:", error);
     if (error.name === 'CastError') {
       return res.status(400).json({ message: 'Invalid reminder ID format' });
    }
    res.status(500).json({ message: 'Failed to delete reminder', error: error.message });
  }
});

module.exports = router; 