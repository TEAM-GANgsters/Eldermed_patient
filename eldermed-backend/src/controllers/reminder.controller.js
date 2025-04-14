const Reminder = require('../models/reminder.model');
const WhatsAppService = require('../services/whatsapp.service');
const logger = require('../utils/logger');

/**
 * Get all reminders
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const reminders = await Reminder.find({ userId });
    res.status(200).json(reminders);
  } catch (error) {
    logger.error(`Error fetching reminders: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch reminders', error: error.message });
  }
};

/**
 * Get a single reminder by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.status(200).json(reminder);
  } catch (error) {
    logger.error(`Error fetching reminder: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch reminder', error: error.message });
  }
};

/**
 * Create a new reminder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createReminder = async (req, res) => {
  try {
    const { name, time, days, enabled, whatsappEnabled, phoneNumber } = req.body;
    
    const newReminder = new Reminder({
      name,
      time: Array.isArray(time) ? time : [time],
      days,
      enabled: enabled || true,
      userId: req.user.id,
      whatsappEnabled: whatsappEnabled || false,
      phoneNumber: phoneNumber || ''
    });
    
    const savedReminder = await newReminder.save();
    
    // If WhatsApp is enabled, schedule the reminder
    if (whatsappEnabled && phoneNumber) {
      try {
        await WhatsAppService.scheduleReminder(savedReminder);
      } catch (whatsappError) {
        logger.error(`Failed to schedule WhatsApp reminder: ${whatsappError.message}`);
        // Continue anyway, the reminder is saved
      }
    }
    
    res.status(201).json(savedReminder);
  } catch (error) {
    logger.error(`Error creating reminder: ${error.message}`);
    res.status(500).json({ message: 'Failed to create reminder', error: error.message });
  }
};

/**
 * Update an existing reminder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateReminder = async (req, res) => {
  try {
    const { name, time, days, enabled } = req.body;
    
    const reminder = await Reminder.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    // Update fields
    if (name) reminder.name = name;
    if (time) reminder.time = Array.isArray(time) ? time : [time];
    if (days) reminder.days = days;
    if (enabled !== undefined) reminder.enabled = enabled;
    
    const updatedReminder = await reminder.save();
    
    res.status(200).json(updatedReminder);
  } catch (error) {
    logger.error(`Error updating reminder: ${error.message}`);
    res.status(500).json({ message: 'Failed to update reminder', error: error.message });
  }
};

/**
 * Delete a reminder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    await reminder.remove();
    
    res.status(200).json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting reminder: ${error.message}`);
    res.status(500).json({ message: 'Failed to delete reminder', error: error.message });
  }
};

/**
 * Toggle WhatsApp notifications for a reminder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.toggleWhatsAppForReminder = async (req, res) => {
  try {
    const { whatsappEnabled, phoneNumber } = req.body;
    
    if (whatsappEnabled === undefined) {
      return res.status(400).json({ message: 'whatsappEnabled field is required' });
    }
    
    if (whatsappEnabled && !phoneNumber) {
      return res.status(400).json({ message: 'phoneNumber is required when enabling WhatsApp' });
    }
    
    const reminder = await Reminder.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    // Update WhatsApp settings
    reminder.whatsappEnabled = whatsappEnabled;
    if (phoneNumber) reminder.phoneNumber = phoneNumber;
    
    const updatedReminder = await reminder.save();
    
    // If WhatsApp is enabled, schedule the reminder
    if (whatsappEnabled && phoneNumber) {
      try {
        await WhatsAppService.scheduleReminder(updatedReminder);
      } catch (whatsappError) {
        logger.error(`Failed to schedule WhatsApp reminder: ${whatsappError.message}`);
        // Continue anyway, the reminder is saved
      }
    }
    
    res.status(200).json(updatedReminder);
  } catch (error) {
    logger.error(`Error toggling WhatsApp for reminder: ${error.message}`);
    res.status(500).json({ message: 'Failed to toggle WhatsApp for reminder', error: error.message });
  }
}; 