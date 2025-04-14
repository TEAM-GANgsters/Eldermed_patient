const { db } = require('../utils/dbClient'); // May need db access later

/**
 * Generates a basic, fixed schedule based on common frequency terms.
 * TODO: Replace this with AI-based scheduling and user preferences.
 * @param {string} frequency - The frequency string (e.g., "twice a day", "daily").
 * @returns {Array<string>|null} - Array of suggested times (e.g., ["09:00", "21:00"]) or null.
 */
function generateBasicSchedule(frequency) {
    if (!frequency) return null;

    const freqLower = frequency.toLowerCase();

    // Check for specific times first (simple regex)
    const timeMatch = freqLower.match(/(\d{1,2})\s*([ap]m)/i); // e.g., "8am", "10 pm"
    if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const period = timeMatch[2].toLowerCase();
        if (period === 'pm' && hour !== 12) {
            hour += 12;
        } else if (period === 'am' && hour === 12) { // Midnight case
            hour = 0;
        }
        if (hour >= 0 && hour < 24) {
            return [hour.toString().padStart(2, '0') + ":00"]; // Return as HH:00
        }
    }

    if (freqLower.includes('once a day') || freqLower.includes('daily')) {
        return ["09:00"]; // Default morning
    } else if (freqLower.includes('twice a day')) {
        return ["09:00", "21:00"]; // Default morning/evening
    } else if (freqLower.includes('thrice a day') || freqLower.includes('3 times a day')) {
        return ["08:00", "14:00", "20:00"]; // Default 3 times
    } else if (freqLower.includes('4 times a day')) {
        return ["07:00", "12:00", "17:00", "22:00"];
    } else if (freqLower.includes('bedtime')) {
        return ["21:00"]; // Default bedtime
    }
    // TODO: Handle weekly, monthly, specific times, etc.

    return null; // Cannot determine schedule from this frequency
}

/**
 * Processes a structured medication list and adds basic schedules.
 * @param {string} prescriptionId - The Firestore ID of the prescription document.
 * @param {Array<object>} structuredMedications - The array from nlpService.
 * @returns {Promise<void>}
 */
async function createInitialSchedules(prescriptionId, structuredMedications) {
    try {
        console.log('Creating initial schedule for prescription:', prescriptionId);
        
        // Get the prescription document reference
        const prescriptionRef = db.collection('prescriptions').doc(prescriptionId);
        const prescriptionDoc = await prescriptionRef.get();
        
        if (!prescriptionDoc.exists) {
            throw new Error(`Prescription with ID ${prescriptionId} not found`);
        }
        
        const prescriptionData = prescriptionDoc.data();
        
        // Generate schedules for each medication found in the prescription
        const medicationSchedules = [];
        
        for (const medication of structuredMedications) {
            console.log('Generating schedule for medication:', medication.name);
            
            // Extract relevant medication data
            const { name, dosage, frequency, instructions } = medication;
            
            // Generate reminder times based on frequency and any detected time context
            let reminderTimes = [];
            
            // If explicit reminder times are provided, use those
            if (medication.reminderTimes && medication.reminderTimes.length > 0) {
                reminderTimes = medication.reminderTimes;
            }
            // Otherwise, infer times from frequency text
            else {
                reminderTimes = inferTimesFromFrequency(frequency);
            }
            
            // Add the schedule
            medicationSchedules.push({
                name,
                dosage,
                frequency,
                instructions,
                reminderTimes,
                active: true, // Default to active
                packageImageUrl: prescriptionData.packageImageUrl,
                medicationImageUrl: prescriptionData.medicationImageUrl,
                nextReminderId: null, // Will be set when notifications are configured
                createdAt: new Date()
            });
        }
        
        // Update the prescription with schedules and status
        await prescriptionRef.update({
            medicationSchedules,
            status: 'scheduled', // Mark as scheduled
            updatedAt: new Date()
        });
        
        console.log(`Created ${medicationSchedules.length} medication schedules for prescription ${prescriptionId}`);
        return medicationSchedules;
        
    } catch (error) {
        console.error('Error creating medication schedule:', error);
        throw error;
    }
}

/**
 * Infers medication times based on frequency text
 */
function inferTimesFromFrequency(frequency) {
    if (!frequency) return [];
    
    const times = [];
    const freqLower = frequency.toLowerCase();
    
    // Handle common frequency phrases
    if (freqLower.includes('once') || freqLower.includes('daily') || freqLower.includes('every day')) {
        // If it mentions morning or a.m., set for morning
        if (freqLower.includes('morning') || freqLower.includes('a.m.') || freqLower.includes('am')) {
            times.push('8:00 AM');
        }
        // If it mentions evening, night, or p.m., set for evening
        else if (freqLower.includes('evening') || freqLower.includes('night') || 
                 freqLower.includes('p.m.') || freqLower.includes('pm')) {
            times.push('8:00 PM');
        }
        // Default to morning if no time specified
        else {
            times.push('8:00 AM');
        }
    }
    else if (freqLower.includes('twice') || freqLower.includes('two times') || freqLower.includes('2 times')) {
        // Default twice a day to morning and evening
        times.push('8:00 AM', '8:00 PM');
    }
    else if (freqLower.includes('three times') || freqLower.includes('3 times')) {
        // Default three times a day to morning, noon, evening
        times.push('8:00 AM', '12:00 PM', '8:00 PM');
    }
    else if (freqLower.includes('four times') || freqLower.includes('4 times')) {
        // Four times spread throughout the day
        times.push('8:00 AM', '12:00 PM', '4:00 PM', '8:00 PM');
    }
    else if (freqLower.includes('every') && (freqLower.includes('hour') || freqLower.includes('hrs'))) {
        // Extract the hour number if present
        const hourMatch = freqLower.match(/every\s+(\d+)\s+hours?/i);
        const interval = hourMatch && hourMatch[1] ? parseInt(hourMatch[1]) : 8;
        
        // Generate times based on the interval (from 8 AM to 8 PM)
        for (let hour = 8; hour <= 20; hour += interval) {
            const amPm = hour >= 12 ? 'PM' : 'AM';
            const formattedHour = hour > 12 ? hour - 12 : hour;
            times.push(`${formattedHour}:00 ${amPm}`);
        }
    }
    else if (freqLower.includes('breakfast')) {
        times.push('7:30 AM'); // Before/with breakfast
    }
    else if (freqLower.includes('lunch')) {
        times.push('12:00 PM'); // Around lunch
    }
    else if (freqLower.includes('dinner')) {
        times.push('6:30 PM'); // Around dinner
    }
    else if (freqLower.includes('bedtime')) {
        times.push('10:00 PM'); // Bedtime
    }
    else {
        // Default to morning if we can't determine
        times.push('8:00 AM');
    }
    
    return times;
}

/**
 * Checks all active schedules and identifies due reminders.
 * This function is intended to be run periodically (e.g., every minute).
 */
async function checkReminders() {
    console.log('Checking for due reminders...');
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    try {
        console.log('[checkReminders] Querying scheduled prescriptions...');
        const snapshot = await db.collection('prescriptions')
                             .where('status', '==', 'scheduled')
                             .get();
        
        console.log(`[checkReminders] Found ${snapshot.docs?.length || 0} scheduled prescriptions.`);

        if (snapshot.empty || !snapshot.docs) {
            console.log('[checkReminders] No scheduled prescriptions found.');
            return;
        }

        const notificationsToSend = [];

        // Iterate using snapshot.docs
        for (const doc of snapshot.docs) {
            const prescription = doc.data();
            const prescriptionId = doc.id;
            const userId = prescription.userId;
            const schedules = prescription.medicationSchedules || [];

            schedules.forEach((schedule, index) => {
                if (schedule.active && schedule.reminderTimes && schedule.reminderTimes.includes(currentTime)) {
                    console.log(`REMINDER DUE for User: ${userId}, Prescription: ${prescriptionId}, Medication: ${schedule.name || 'N/A'} at ${currentTime}`);
                    // TODO: Trigger actual notification 
                    // TODO: Update schedule status 
                }
            });
        }

    } catch (error) {
        console.error('Error checking reminders:', error);
    }
}

// TODO: Add functions for:
// - Running the scheduler (checking times, sending reminders) <= Add cron job starter
// - Getting reminders for a user
// - Updating/adjusting schedules
// - Logging taken/skipped doses

// Export the locally defined functions
module.exports = { 
    createInitialSchedules, // Now references the local function
    checkReminders        // Now references the local function
};
