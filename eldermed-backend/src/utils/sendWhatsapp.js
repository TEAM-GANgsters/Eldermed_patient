const twilio = require('twilio');
require('dotenv').config(); // make sure this is present!

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const sendWhatsApp = async (toNumber, message) => {
  try {
    const fullNumber = 'whatsapp:+91' + toNumber;
    await client.messages.create({
      from: fromNumber,
      to: fullNumber,
      body: message
    });

    console.log('✅ WhatsApp sent to', toNumber);
  } catch (error) {
    console.error('❌ WhatsApp failed', error);
  }
};

module.exports = sendWhatsApp;
