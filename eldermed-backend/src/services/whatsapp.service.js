const axios = require('axios');
const twilio = require('twilio');
const config = require('../config');
const logger = require('../utils/logger');

// Twilio client initialization
let twilioClient = null;

// Only initialize Twilio if credentials are valid
if (config.twilio.accountSid && config.twilio.accountSid.startsWith('AC') && config.twilio.authToken) {
  try {
    twilioClient = twilio(
      config.twilio.accountSid,
      config.twilio.authToken
    );
    logger.info('Twilio client initialized successfully');
  } catch (error) {
    logger.error(`Failed to initialize Twilio client: ${error.message}`);
  }
} else {
  logger.warn('Twilio client not initialized: Invalid or missing credentials');
}

/**
 * WhatsApp Service for sending medication reminders
 */
class WhatsAppService {
  /**
   * Send a WhatsApp message using Twilio
   * @param {string} to - Phone number to send the message to (with country code)
   * @param {string} body - Message body
   * @returns {Promise<Object>} Message object from Twilio
   */
  async sendWhatsAppMessage(to, body) {
    try {
      logger.info(`Sending WhatsApp message to ${to}`);
      
      if (!twilioClient) {
        logger.warn('Twilio client not initialized. WhatsApp message not sent.');
        return { status: 'not_sent', reason: 'twilio_not_initialized' };
      }
      
      // Make sure phone number has correct format
      const formattedNumber = this.formatPhoneNumber(to);
      
      const message = await twilioClient.messages.create({
        from: `whatsapp:${config.twilio.fromNumber}`,
        to: `whatsapp:${formattedNumber}`,
        body
      });
      
      logger.info(`WhatsApp message sent, SID: ${message.sid}`);
      return message;
    } catch (error) {
      logger.error(`Failed to send WhatsApp message: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }
  
  /**
   * Send a medication reminder via WhatsApp
   * @param {Object} reminder - Reminder object
   * @returns {Promise<Object>} Message object from Twilio
   */
  async sendMedicationReminder(reminder) {
    if (!reminder.phoneNumber || !reminder.whatsappEnabled) {
      logger.warn(`Cannot send WhatsApp for reminder ${reminder._id}: WhatsApp not enabled or no phone number`);
      return { status: 'not_sent', reason: 'whatsapp_not_enabled' };
    }
    
    if (!twilioClient) {
      logger.warn(`Cannot send WhatsApp reminder: Twilio client not initialized`);
      return { status: 'not_sent', reason: 'twilio_not_initialized' };
    }
    
    const message = `🔔 Medication Reminder 💊\n\nIt's time to take your medication: ${reminder.name}\n\nStay healthy! 👍`;
    
    return this.sendWhatsAppMessage(reminder.phoneNumber, message);
  }
  
  /**
   * Schedule a WhatsApp reminder using Twilio's API
   * @param {Object} reminder - Reminder object
   * @returns {Promise<Object>} Scheduled reminder
   */
  async scheduleReminder(reminder) {
    // Implementation depends on scheduling requirements
    // For now, we'll just use immediate sending for demonstration
    return this.sendMedicationReminder(reminder);
  }
  
  /**
   * Format phone number to E.164 format required by Twilio
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Strip non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add + if not present
    if (!cleaned.startsWith('+')) {
      // If number doesn't start with country code, add default (e.g., +1 for US)
      if (!cleaned.startsWith('1')) {
        cleaned = '1' + cleaned;
      }
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }
}

module.exports = new WhatsAppService(); 