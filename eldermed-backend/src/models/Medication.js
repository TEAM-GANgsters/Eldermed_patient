const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // links to the User model
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  dosage: {
    type: String, // e.g., "1 tablet"
    required: true,
  },
  time: {
    type: [String], // array of times like ["08:00", "20:00"]
    required: true,
  },
  frequency: {
    type: String, // e.g., "daily", "weekly"
    default: "daily",
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  notes: {
    type: String,
  }
});

const Medication = mongoose.model('Medication', medicationSchema);
module.exports = Medication;
