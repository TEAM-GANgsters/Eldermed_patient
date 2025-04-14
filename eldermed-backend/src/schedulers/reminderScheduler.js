const cron = require('node-cron');
const moment = require('moment');
const Medication = require('../models/Medication');
const User = require('../models/User');
const sendWhatsApp = require('../utils/sendWhatsapp');

// Run every minute
cron.schedule('* * * * *', async () => {
  console.log('⏰ Checking for upcoming meds...');

  const now = moment().format('HH:mm');

  try {
    const meds = await Medication.find();

    for (let med of meds) {
      if (med.time.includes(now)) {
        const user = await User.findById(med.userId);

        if (user && user.phone) {
          const msg = `💊 Reminder: ${med.name} (${med.dosage}) at ${now}\nNote: ${med.notes || 'No notes'}`;
          await sendWhatsApp(user.phone, msg);
          console.log(`✅ Reminder sent to ${user.name}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error in reminder scheduler:', err);
  }
});
