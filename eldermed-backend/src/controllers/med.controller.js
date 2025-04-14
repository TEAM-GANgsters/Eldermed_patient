const Medication = require('../models/Medication');
const User = require('../models/User');

// Add medication
const addMedication = async (req, res) => {
  try {
    const medication = new Medication(req.body);
    await medication.save();
    res.status(201).json({ message: 'Medication added ✅', medication });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get medications by userId
const getMedicationsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const meds = await Medication.find({ userId });
    res.json(meds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// NEW: Get meds for caretaker's linked users
const getMedsForCaretaker = async (req, res) => {
  try {
    const caretakerId = req.user.userId;
    const caretaker = await User.findById(caretakerId);

    if (!caretaker || caretaker.role !== 'caretaker') {
      return res.status(403).json({ error: 'Only caretakers can access this.' });
    }

    const meds = await Medication.find({
      userId: { $in: caretaker.caretakerFor }
    });

    res.json(meds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addMedication, getMedicationsByUser, getMedsForCaretaker };
