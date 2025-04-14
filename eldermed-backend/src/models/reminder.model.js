const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  medicationName: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true,
  },
  daysOfWeek: [{ // e.g., ['Mon', 'Wed', 'Fri']
    type: String,
    required: true,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] // Or use numbers 0-6
  }],
  time: { // Store time as HH:mm (24-hour format)
    type: String,
    required: [true, 'Time is required'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'],
  },
  appNotification: {
    type: Boolean,
    default: true,
  },
  whatsappAlert: {
    type: Boolean,
    default: false,
  },
  // Add phone number for WhatsApp alerts
  phoneNumber: {
    type: String,
    // Only validate if whatsapp alerts are enabled
    validate: {
      validator: function(v) {
        if (this.whatsappAlert) {
          return /^\+?[1-9]\d{9,14}$/.test(v); // Basic international phone format validation
        }
        return true;
      },
      message: 'A valid phone number is required when WhatsApp alerts are enabled'
    },
    default: ""
  },
  // Optional: add dosage, instructions, etc.
  dosage: String,
  instructions: String,
  // Keep track if the reminder job is scheduled
  isScheduled: {
    type: Boolean,
    default: false
  },
  // Store the ID of the scheduled job (if using node-schedule or similar)
  scheduledJobId: String 
}, { timestamps: true });

// Index for efficient querying by user
reminderSchema.index({ user: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder; 